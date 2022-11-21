import React, {useEffect, useState} from "react";
import {BarCodeScanner} from "expo-barcode-scanner";
import {Alert, Button, FlatList, Pressable, SafeAreaView, Text, TextInput, View} from "react-native";
import {styles} from "./styles";
import { ipAddress } from "./conf";
import { Item } from "./conf";

export function AddScreen({navigation, route} : any) {
    const [localItemsId, setItemsId] = useState<Item[]>([]);
    const [localInput, setInput] = useState("1");
    const [hasPermission, setHasPermission] = useState<boolean|null>(null);
    const [scanned, setScanned] = useState(false);

    let itemsId : Item[] = [];
    let params = route.params

    if (params && params.itemsId) {
        itemsId = Array.from(params.itemsId)
        setItemsId([...itemsId])
        params.itemsId = undefined
    }

    useEffect(() => {
        const getBarCodeScannerPermissions = async () => {
            const { status } = await BarCodeScanner.requestPermissionsAsync();
            setHasPermission(status === 'granted');
        };

        getBarCodeScannerPermissions();
    }, []);

    const handleBarCodeScanned = ({ type, data }: any) => {
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
                const index = localItemsId.findIndex((item) => item.id == id);
                if (index == -1) {
                    localItemsId.push({id: id, name: item.name, price: item.price, amount: 1});
                } else {
                    localItemsId[index].amount++;
                }
                setItemsId([...localItemsId]);
            }
        } else {
            Alert.alert('Error', 'Item not found or backend offline');
        }
    }

    function flushPanier() {
        setItemsId([])
    }

    function removeButton(id: number) {
        const index = localItemsId.findIndex((thisItem) => thisItem.id == id);
        if (index > -1) {
            if(localItemsId[index].amount > 1) {
                localItemsId[index].amount--;
            } else {
                localItemsId.splice(index, 1);
            }
        }
        setItemsId([...localItemsId]);
    }

    function addButton(id: number) {
        const index = localItemsId.findIndex((thisItem) => thisItem.id == id);
        if (index > -1) {
            localItemsId[index].amount++;
        }
        setItemsId([...localItemsId]);
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
            <FlatList data={localItemsId}
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
                       onPress={() => navigation.navigate('Paiement', {itemsId: localItemsId})}>
                <Text>Vers le paiement</Text>
            </Pressable>
            <Button title="Vers la liste des achats" onPress={() => navigation.navigate('Liste des achats')}/>
        </SafeAreaView>
    );
}