# bcs-client

# Compte rendu

Bonne application.

il pourrait être sympa de créer un service pour tes appels d'API (Items, Payments...), par exemple :

```js
// items.service.ts

cosnt get = (id: number) => {
    // ...
}

const getAll = () => {
    // ...
}

export const ItemsService = {
    get,
    getAll
}
```

Cela permet de rendre le code beaucoup plus lisible.

Pour ta prochaine application tu peux t'inspirer de l'architecture de *Trackie* : https://github.com/etasdemir/Trackie
