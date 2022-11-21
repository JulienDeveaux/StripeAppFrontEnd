import {StyleSheet} from "react-native";

export const styles = StyleSheet.create({
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