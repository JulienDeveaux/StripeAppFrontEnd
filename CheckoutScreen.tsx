import { useStripe } from "@stripe/stripe-react-native";
import React, { useEffect, useState } from "react";
import {Alert, Text, Button, SafeAreaView, StyleSheet, TextInput, FlatList, Pressable, View} from "react-native";
import {NavigationContainer} from "@react-navigation/native";
import {createNativeStackNavigator} from "@react-navigation/native-stack";
import { BarCodeScanner } from 'expo-barcode-scanner';

const Stack = createNativeStackNavigator();

type Item = {
    id: number,
    name: string,
    price: number,
    amount: number
}

let amount = -1;
let userId = 1;
let itemsId: Item[] = [];

const ipAddress = "192.168.25.36"

export function BoughtScreen({navigation, route} : any) {
    const[localItemsList, setItemsList] = useState([]);

    const getBoughtItems = async () => {
        const response = await fetch(`http://${ipAddress}:8000/payments/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        if(response.status == 200) {
            const json = await response.json()
            let res : any[] = []
            for(let i = 0; i < json.length; i++) {
                for(let j = 0; j < json[i].purchased_items.length; j++) {
                    const index = res.findIndex((item) => item.name == json[i].purchased_items[j].item.name);
                    if(index == -1) {
                        res.push({
                            name: json[i].purchased_items[j].item.name,
                            price: json[i].purchased_items[j].item.price,
                            amount: 1
                        })
                    } else {
                        res[index].amount++
                    }
                }
            }
            setItemsList(res)
        }
    }

    useEffect(() => {
        getBoughtItems();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Liste des achats</Text>
            <FlatList data={localItemsList} renderItem={({item}) =>
                <Text>{item.name}, prix : {item.price}, quantité : {item.amount}</Text>
            }/>
            <Button title="Vers l'ajout d'item" onPress={() => navigation.navigate('Ajout d\'item')}/>
        </SafeAreaView>
    );
}

export function AddScreen({navigation, route} : any) {
    const[localItemsId, setItemsId] = useState(itemsId);
    const[localInput, setInput] = useState("1");
    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        const getBarCodeScannerPermissions = async () => {
            const { status } = await BarCodeScanner.requestPermissionsAsync();
            setHasPermission(status === 'granted');
        };

        getBarCodeScannerPermissions();
    }, []);

    const handleBarCodeScanned = ({ type, data }) => {
        setScanned(true);
        console.log(`Bar code with type ${type} and data ${data} has been scanned!`);
        setInput(data)
        addItemToCart()
    };

    if (hasPermission === null) {
        return <Text>Requesting for camera permission</Text>;
    }
    if (hasPermission === false) {
        return <Text>No access to camera</Text>;
    }

    let params = route.params
    if (params && params.itemsId) {
        itemsId = Array.from(params.itemsId)
        params.itemsId = undefined
    }

    const setTitle = (id : string) => {
        setInput(id);
    }

    const addItemToCart = async () => {
        let id : number;
        try {
            id = parseInt(localInput);
            if(id == -1) {
                throw new Error("")
            }
        } catch (e) {
            Alert.alert('Error', 'Please enter a valid id');
            return;
        }
        const response = await fetch('http:/' + ipAddress + ':8000/items/' + id)
        if (response.status == 200) {
            const item = await response.json()
            if(item == null) {
                Alert.alert("Item not found with id : " + id)
            } else {
                const index = itemsId.findIndex((item) => item.id == id);
                if (index == -1) {
                    itemsId.push({id: id, name: item.name, price: item.price, amount: 1});
                } else {
                    itemsId[index].amount++;
                }
                setItemsId([...itemsId]);
            }
        } else {
            Alert.alert('Error', 'Item not found or backend offline');
        }
    }

    function flushPanier() {
        itemsId = []
        setItemsId([...itemsId])
    }

    function removeButton(id: number) {
        const index = itemsId.findIndex((thisItem) => thisItem.id == id);
        if (index > -1) {
            if(itemsId[index].amount > 1) {
                itemsId[index].amount--;
            } else {
                itemsId.splice(index, 1);
            }
        }
        setItemsId([...itemsId]);
    }

    function addButton(id: number) {
        const index = itemsId.findIndex((thisItem) => thisItem.id == id);
        if (index > -1) {
            itemsId[index].amount++;
        }
        setItemsId([...itemsId]);
    }

    return (
        <SafeAreaView style={styles.container}>
            <BarCodeScanner
                onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                style={styles.qrScanner}
            />
            <Button title={'Tap to Scan Again'} onPress={() => setScanned(false)} />
            <TextInput style={styles.input}
                       onChangeText={(id) => setTitle(id)}
                       placeholder="Article number here"
                       keyboardType="numeric"
                       value={localInput}
            />
            <Button
                title="Add to cart"
                onPress={addItemToCart}
            />
            <Text style={styles.title}>Panier</Text>
            <FlatList data={itemsId}
                      renderItem={({item}) =>
                          <View style={styles.viewCrud}>
                              <Text style={styles.flatListTextCrud}>{item.name}, qté : {item.amount}, {item.price * item.amount} €</Text>
                              <Pressable style={{...styles.redColor, ...styles.crudButton}}
                                         onPress={() => {removeButton(item.id)}}>
                                    <Text>-</Text>
                              </Pressable>
                              <Pressable style={{...styles.greenColor, ...styles.crudButton}}
                                         onPress={() => {addButton(item.id)}}>
                                    <Text>+</Text>
                              </Pressable>
                          </View>
                      }/>
            <Pressable style={{...styles.button, ...styles.redColor}}
                       onPress={() => flushPanier()}>
                <Text>Vider le panier</Text>
            </Pressable>
            <Text>Prix total : {itemsId.reduce((acc, item) => acc + item.price * item.amount, 0)} euros</Text>
            <Pressable style={{...styles.button, ...styles.greenColor}}
                       onPress={() => navigation.navigate('Paiement', {itemsId: itemsId})}>
                <Text>Vers le paiement</Text>
            </Pressable>
            <Button title="Vers la liste des achats" onPress={() => navigation.navigate('Liste des achats')}/>
        </SafeAreaView>
    );
}

export function CheckoutScreen({navigation, route} : any) {
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [loading, setLoading] = useState(false);
    const [paymentIntentId, setPaymentIntentId] = useState<string>("");

    const fetchPaymentSheetParams = async () => {
        amount = itemsId.reduce((acc, item) => acc + (item.price) * item.amount, 0);
        const response = await fetch(`http://${ipAddress}:8000/payments/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "amount": amount,
                "customer_id": userId
            })
        });

        const { paymentIntent, ephemeralKey, customer } = await response.json();

        return {
            paymentIntent,
            ephemeralKey,
            customer,
        };
    };

    const initializePaymentSheet = async () => {
        const {
            paymentIntent,
            ephemeralKey,
            customer,
        } = await fetchPaymentSheetParams();

        const { error } = await initPaymentSheet({
            merchantDisplayName: "Example, Inc.",
            customerId: customer,
            customerEphemeralKeySecret: ephemeralKey,
            paymentIntentClientSecret: paymentIntent,
            allowsDelayedPaymentMethods: false,
        });

        if (!error) {
            setPaymentIntentId(paymentIntent);
            setLoading(true);
        }
    };

    const openPaymentSheet = async () => {
        const { error } = await presentPaymentSheet();

        if (error) {
            Alert.alert(`Error code: ${error.code}`, error.message);
        } else {
            const paymentIntent = `pi_${paymentIntentId.split("_")[1]}`;
            let itemsIdOnly : number[] = []
            for(let i = 0; i < itemsId.length; i++) {
                for(let j = 0; j < itemsId[i].amount; j++) {
                    itemsIdOnly.push(parseInt(String(itemsId[i].id)))
                }
            }
            const response = await fetch(`http://${ipAddress}:8000/payments/check/${paymentIntent}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "items_id": itemsIdOnly,
                    "customer_id": userId
                })
            });

            if (response.status == 200) {
                Alert.alert('Success', 'Your order is confirmed!');
            } else {
                Alert.alert('Error', 'There was an issue during the payment, please try later');
            }
        }
    };

    useEffect(() => {
        initializePaymentSheet();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Payment</Text>
            <Button
                disabled={!loading}
                title="Checkout"
                onPress={openPaymentSheet}
            />
            <Button title="Vers l'ajout d'item" onPress={() => navigation.navigate('Ajout d\'item')}/>
            <Button title="Vers la liste des achats" onPress={() => navigation.navigate('Liste des achats')}/>
        </SafeAreaView>
    );
}

export default function routes() {
    return (
        <NavigationContainer>
            <Stack.Navigator>
                <Stack.Screen name="Ajout d'item" component={AddScreen} />
                <Stack.Screen name="Paiement" component={CheckoutScreen}></Stack.Screen>
                <Stack.Screen name="Liste des achats" component={BoughtScreen}></Stack.Screen>
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    viewCrud: {
        flexDirection: 'row',
        width: "90%"
    },
    title: {
        fontSize: 30,
    },
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 4,
        elevation: 3,
        width: 200
    },
    crudButton: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 4,
        elevation: 3,
        width: 10
    },
    flatListTextCrud: {
        textAlign: 'center',
        flexDirection: 'row',
    },
    flatListText: {
        textAlign: 'center',
        borderWidth: 1,
        width: 200
    },
    qrScanner: {
        width: "50%",
        height: "50%"
    },
    input: {
        width: 200,
        borderWidth: 1,
        padding: 0,
        textAlign: 'center'
    },
    blueColor: {
        backgroundColor: "#0aebfe"
    },
    redColor: {
        backgroundColor: "#ff494c"
    },
    greenColor: {
        backgroundColor: "#1ad51a"
    }
});