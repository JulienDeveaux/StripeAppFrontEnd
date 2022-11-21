import React from "react";
import {NavigationContainer} from "@react-navigation/native";
import {createNativeStackNavigator} from "@react-navigation/native-stack";
import { AddScreen } from './AddScreen'
import { BoughtScreen } from "./BoughScreen";
import { CheckoutScreen } from "./CheckoutScreen";

const Stack = createNativeStackNavigator();

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