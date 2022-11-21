import {useStripe} from "@stripe/stripe-react-native";
import React, {useEffect, useState} from "react";
import {ipAddress, Item, userId} from "./conf";
import {Alert, Button, SafeAreaView, Text} from "react-native";
import {styles} from "./styles";
import * as SecureStore from "expo-secure-store";

export function CheckoutScreen({navigation, route} : any) {
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [loading, setLoading] = useState(false);
    const [paymentIntentId, setPaymentIntentId] = useState<string>("");
    const [localItemsId, setItemsId] = useState<Item[]>([]);

    let itemsId : Item[] = [];
    let params = route.params

    if (params && params.itemsId) {
        itemsId = Array.from(params.itemsId)
        setItemsId([...itemsId])
        params.itemsId = undefined
    }

    const fetchPaymentSheetParams = async () => {
        let amount = localItemsId.reduce((acc, item) => acc + (item.price) * item.amount, 0);
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
            for(let i = 0; i < localItemsId.length; i++) {
                for(let j = 0; j < localItemsId[i].amount; j++) {
                    itemsIdOnly.push(parseInt(String(localItemsId[i].id)))
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
                await SecureStore.deleteItemAsync("items");
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
            <Button title="Vers l'ajout d'item" onPress={() => navigation.navigate('Ajout d\'item', {itemsId: localItemsId})}/>
            <Button title="Vers la liste des achats" onPress={() => navigation.navigate('Liste des achats')}/>
        </SafeAreaView>
    );
}