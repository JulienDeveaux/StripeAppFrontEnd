import { useStripe } from "@stripe/stripe-react-native";
import React, { useEffect, useState } from "react";
import {Alert, Text, Button, SafeAreaView, StyleSheet, TextInput, FlatList, Pressable, View} from "react-native";
import {NavigationContainer} from "@react-navigation/native";
import {createNativeStackNavigator} from "@react-navigation/native-stack";

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

const ipAddress = "192.168.1.73"

export function AddScreen({navigation, route} : any) {
    const[localItemsId, setItemsId] = useState(itemsId);
    const[localInput, setInput] = useState("1");

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
            const item = await response.json();
            const index = itemsId.findIndex((item) => item.id == id);
            if (index == -1) {
                itemsId.push({id: id, name: item.name, price: item.price, amount: 1});
            } else {
                itemsId[index].amount++;
            }
            setItemsId([...itemsId]);
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
                              <Text style={styles.flatListTextCrud}>{item.name}, prix : {item.price}, quantité : {item.amount} prix total : {item.price * item.amount}</Text>
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
        </SafeAreaView>
    );
}

export function CheckoutScreen({navigation, route} : any) {
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [loading, setLoading] = useState(false);
    const [paymentIntentId, setPaymentIntentId] = useState<string>("");

    const fetchPaymentSheetParams = async () => {
        amount = itemsId.reduce((acc, item) => acc + item.price, 0);
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
                itemsIdOnly.push(parseInt(String(itemsId[i].id)))
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

            if (response.status == 200) Alert.alert('Success', 'Your order is confirmed!');
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
        </SafeAreaView>
    );
}

export default function routes() {
    return (
        <NavigationContainer>
            <Stack.Navigator>
                <Stack.Screen name="Ajout d'item" component={AddScreen} />
                <Stack.Screen name="Paiement" component={CheckoutScreen}></Stack.Screen>
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
        width: "80%"
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
        paddingHorizontal: 12,
        borderRadius: 4,
        elevation: 3,
        width: 10
    },
    flatListTextCrud: {
        textAlign: 'center'
    },
    flatListText: {
        textAlign: 'center',
        borderWidth: 1,
        width: 200
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