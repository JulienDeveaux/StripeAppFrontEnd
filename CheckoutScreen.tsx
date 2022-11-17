import { useStripe } from "@stripe/stripe-react-native";
import React, { useEffect, useState } from "react";
import {Alert, Text, Button, SafeAreaView, StyleSheet, TextInput, FlatList} from "react-native";
import {NavigationContainer} from "@react-navigation/native";
import {createNativeStackNavigator} from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator();

type Item = {
    id: number,
    price: number
}

let amount = -1;
let userId = 1;
let itemsId: Item[] = [];

const ipAddress = "192.168.1.73"

export function PanierScreen({navigation, route} : any) {
    const[localItemsId, setItemsId] = useState(itemsId);

    let params = route.params
    if (params && params.itemsId) {
        itemsId = Array.from(params.itemsId)
        params.itemsId = undefined
    }

    function flushPanier() {
        itemsId = []
        setItemsId(itemsId)
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Panier</Text>
            <FlatList data={itemsId}
                      renderItem={({item}) =>
                <Text style={styles.flatListText}>item N° {item.id}, prix : {item.price}</Text>
            }/>
            <Text style={styles.title}>Total</Text>
            <Text>{itemsId.reduce((acc, item) => acc + item.price, 0)} euros</Text>
            <Button title="Vider le panier" onPress={flushPanier}/>
            <Button title="Vers l'ajout d'item" onPress={() => navigation.navigate('Ajout d\'item', {itemsId: itemsId})}/>
            <Button title="Vers le paiement" onPress={() => navigation.navigate('Paiement', {itemsId: itemsId})}/>
        </SafeAreaView>
    );
}

export function AddScreen({navigation, route} : any) {
    const[localItemsId, setItemsId] = useState(itemsId);
    let itemId : string = "-1";

    const setTitle = (id : string) => {
        itemId = id;
    }

    const addItemToCart = async () => {
        let id : number;
        try {
            id = parseInt(itemId);
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
            itemsId.push({id: id, price: item.price})
            setItemsId(itemsId);
            Alert.alert('Success', 'Item added to cart ' + item.name + " " + item.price + " amount : " + itemsId.reduce((acc, item) => acc + item.price, 0));
        } else {
            Alert.alert('Error', 'Item not found or backend offline');
        }
    }
    return (
        <SafeAreaView style={styles.container}>
            <TextInput style={styles.input}
                       onChangeText={(id) => setTitle(id)}
                       placeholder="Article number here"
                       keyboardType="numeric"
            />
            <Button
                title="Add to cart"
                onPress={addItemToCart}
            />
            <Button title="Vers le panier" onPress={
                () => navigation.navigate('Panier', {itemsId: itemsId})
            }/>
            <Button title="Vers le paiement" onPress={
                () => navigation.navigate('Paiement', {itemsId: itemsId})
            }/>
        </SafeAreaView>
    );
}

export function CheckoutScreen({navigation, route} : any) {
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [loading, setLoading] = useState(false);
    const [paymentIntentId, setPaymentIntentId] = useState<string>("");

    const fetchPaymentSheetParams = async () => {
        if(amount == -1) {
            amount = itemsId.reduce((acc, item) => acc + item.price, 0);
        }
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
            const response = await fetch(`http://${ipAddress}:8000/payments/check/${paymentIntent}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "items_id": itemsId,
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
            <Button title="Vers le panier" onPress={() => navigation.navigate('Panier')}/>
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
                <Stack.Screen name="Panier" component={PanierScreen}></Stack.Screen>
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
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
        backgroundColor: "#00ff00"
    }
});