import React, {useEffect, useState} from "react";
import {Button, FlatList, SafeAreaView, Text} from "react-native";
import {styles} from "./styles";
import { ipAddress } from "./conf";
import { userId } from "./conf";
import { Item } from "./conf";

export function BoughtScreen({navigation} : any) {
    const [localItemsList, setItemsList] = useState<Item[]>([]);

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