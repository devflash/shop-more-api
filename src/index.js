const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { firestore, auth } = require('./utils/firebase');
const { firebaseAdmin } = require('./utils/firebaseAdmin');
const port = 3001;

const app = express();

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

app.get('/api/orders/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const userCollection = await firestore
      .collection('users')
      .doc(userId)
      .get();
    // .collection('orders')
    // .get();
    if (!userCollection.exists) {
      throw new Error('INVALID_USER');
    }
    const response = await userCollection.ref.collection('orders').get();
    const orders = response.docs.map((cur) => {
      return { ...cur.data() };
    });

    res.status(200).send({ msg: 'ORDERS_FETCHED', orders });
  } catch (e) {
    res.status(400).send(`${e.message}`);
  }
});

app.post('/api/signIn', async (req, res) => {
  try {
    const payload = req.body;
    const { email, password } = payload;
    const userCredentials = await auth.signInWithEmailAndPassword(
      email,
      password
    );
    if (userCredentials?.user) {
      const user = auth.currentUser;
      const token = await user.getIdToken();

      const authUser = {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        token: token,
      };
      res.status(200).send({ msg: 'SIGNED_IN_SUCCESS', authUser });
    }
  } catch (e) {
    res.status(400).send({ code: e.code });
  }
});

app.post('/api/signUp', async (req, res) => {
  const payload = req.body;
  const { email, password, firstName, lastName } = payload;
  try {
    const result = await auth.createUserWithEmailAndPassword(email, password);
    const displayName = `${firstName} ${lastName}`;
    await result.user.updateProfile({ displayName });
    const authUser = {
      uid: result.user.uid,
      displayName: result.user.displayName,
      email: result.user.email,
      phoneNumber: result.user.phoneNumber,
    };
    await firestore.collection('users').doc(authUser.uid).set(payload);
    res.status(200).send({ msg: 'ACCOUNT_CREATED', authUser });
  } catch (e) {
    res.status(400).send({ code: e.code });
  }
});

app.get('/api/signOut', async (req, res) => {
  try {
    await auth.signOut();
    res.status(200).send({ msg: 'SIGNOUT_SUCCESSFUL' });
  } catch (e) {
    res.status(400).send({ code: e.code });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const collection = await firestore.collection('products').get();
    const products = collection.docs.map((product) => {
      return {
        productId: product.id,
        ...product.data(),
      };
    });
    res.status(200).send(products);
  } catch (e) {
    res.status(400).send({ e });
  }
});

app.get('/api/product/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;

    const product = await firestore.collection('products').doc(productId).get();
    res.status(200).send(product.data());
  } catch (e) {
    res.status(400).send({ e });
  }
});

app.get('/api/wishlist/:userId', async (req, res) => {
  const userId = req.params.userId;
  try {
    const userCollection = await firestore
      .collection('users')
      .doc(userId)
      .get();
    // .collection('wishlist')
    // .get();
    if (!userCollection.exists) {
      throw new Error('INVALID_USER');
    }
    const response = await userCollection.ref.collection('wishlist').get();
    const userWishlist = response.docs.map((wishlist) => {
      return {
        ...wishlist.data(),
      };
    });
    res.status(200).json({ msg: 'WISHLIST_FETCHED', userWishlist });
  } catch (e) {
    res.status(400).send(`${e.message}`);
  }
});

app.post('/api/wishlist/add', async (req, res) => {
  const wishlist = req.body;
  try {
    const existing = await firestore
      .collection('users')
      .doc(wishlist.userId)
      .collection('wishlist')
      .where('id', '==', wishlist.id)
      .get();
    if (!existing.empty) {
      throw new Error('WISHLIST_ALREADY_EXIST');
    }
    await firestore
      .collection('users')
      .doc(wishlist.userId)
      .collection('wishlist')
      .add(wishlist);

    res.status(200).send({ msg: 'WISHLIST_SUCCESS' });
  } catch (error) {
    res.status(400).send(`${error.message}`);
  }
});

app.get('/api/cart/:userId', async (req, res) => {
  const userId = req.params.userId;
  try {
    const collection = await firestore.collection('users').doc(userId).get();

    if (!collection.exists) {
      throw new Error('INVALID_USER');
    }
    const cartCollection = await collection.ref.collection('cart').get();

    const userCart = cartCollection.docs.map((cart) => {
      return {
        ...cart.data(),
      };
    });
    res.status(200).json({ msg: 'CART_FETCHED', items: userCart });
  } catch (e) {
    res.status(400).send(`${e.message}`);
  }
});

app.delete('/api/wishlist/remove/:userId/:productId', async (req, res) => {
  const { userId, productId } = req.params;

  try {
    const item = await firestore
      .collection('users')
      .doc(userId)
      .collection('wishlist')
      .where('id', '==', Number(productId))
      .get();

    item.forEach((cur) => {
      cur.ref.delete();
    });
    res.status(200).json({ msg: 'PRODUCT_REMOVED' });
  } catch (e) {
    res.status(400).send(`${e.message}`);
  }
});

app.delete('/api/cart/remove', async (req, res) => {
  const cart = req.body;

  try {
    const item = await firestore
      .collection('users')
      .doc(cart.userId)
      .collection('cart')
      .where('id', '==', cart.itemId)
      .get();
    item.forEach((ele) => {
      ele.ref.delete();
    });
    res.status(200).json({ msg: 'PRODUCT_DELETED_CART' });
  } catch (e) {
    res.status(400).send(`${e.message}`);
  }
});

app.delete('/api/cart/removeAll', async (req, res) => {
  const { userId } = req.body;
  try {
    const snapshot = await firestore
      .collection('users')
      .doc(userId)
      .collection('cart')
      .get();
    snapshot.forEach((doc) => doc.ref.delete());
    res.status(200).json({ msg: 'EMPTY_CART' });
  } catch (e) {
    res.status(400).send(`${e.message}`);
  }
});

app.post('/api/cart/add', async (req, res) => {
  const cart = req.body;
  //   console.log(cart);
  try {
    const existing = await firestore
      .collection('users')
      .doc(cart.userId)
      .collection('cart')
      .where('id', '==', cart.id)
      .get();

    if (!existing.empty) {
      existing.docs.forEach(async (doc) => {
        const count = doc.data().count + 1;
        await firestore
          .collection('users')
          .doc(cart.userId)
          .collection('cart')
          .doc(doc.id)
          .set({ count }, { merge: true });
      });
    } else {
      cart.count = 1;
      const response = await firestore
        .collection('users')
        .doc(cart.userId)
        .collection('cart')
        .add(cart);
    }

    res.status(200).send({ msg: 'PRODUCT_ADDED_CART' });
  } catch (e) {
    res.status(400).send(`${e.message}`);
  }
});

app.get('/api/address/all/:userId', async (req, res) => {
  const userId = req.params.userId;
  const addresses = [];
  try {
    const userCollection = await firestore
      .collection('users')
      .doc(userId)
      .get();
    // .collection('addresses')
    // .get();

    if (!userCollection.exists) {
      throw new Error('INVALID_USER');
    }
    const response = await userCollection.ref.collection('addresses').get();
    response.docs.forEach((address, i) => {
      addresses.push({
        id: address.id,
        ...address.data(),
        selected: i === 0,
      });
    });
    res.status(200).json({ msg: 'ADDRESSES_FETCHED', addresses });
  } catch (e) {
    res.status(400).send(`${e.message}`);
  }
});

app.delete('/api/address/remove', async (req, res) => {
  try {
    const address = req.body;
    const addressRef = await firestore
      .collection('users')
      .doc(address.userId)
      .collection('addresses')
      .doc(address.id)
      .get();

    addressRef.ref.delete();
    res.status(200).json({ msg: 'ADDRESS_REMOVED' });
  } catch (e) {
    res.status(400).send(`${e.message}`);
  }
});

app.post('/api/address/add', async (req, res) => {
  const address = req.body;
  try {
    await firestore
      .collection('users')
      .doc(address.userId)
      .collection('addresses')
      .add(address);
    res.status(200).json({ msg: 'ADDRESS_ADDED' });
  } catch (e) {
    res.status(400).send(`${e.message}`);
  }
});

app.post('/api/order/save', async (req, res) => {
  try {
    const order = req.body;
    const response = await firestore
      .collection('users')
      .doc(order.userId)
      .collection('orders')
      .add(order);

    res.status(200).json({ msg: 'ORDER_PLACED' });
  } catch (e) {
    res.status(400).send(`${e.message}`);
  }
});

app.get('/api/orders/:userId', async (req, res) => {
  const userId = req.params.userId;
  try {
    const userCollection = await firestore
      .collection('users')
      .doc(userId)
      .get();
    // .collection('orders')
    // .get();
    if (!userCollection.exists) {
      throw new Error('INVALID_USER');
    }
    const response = await userCollection.ref.collection('orders').get();
    const orders = response.docs.map((cur) => {
      return { ...cur.data() };
    });

    res.status(200).json({ msg: 'ORDERS_FETCHED', orders });
  } catch (e) {
    res.status(400).send(`${e.message}`);
  }
});

app.delete('/api/order/cancel/:userId/:orderRef', async (req, res) => {
  const { userId, orderRef } = req.params;
  try {
    const item = await firestore
      .collection('users')
      .doc(userId)
      .collection('orders')
      .where('orderRef', '==', Number(orderRef))
      .get();

    item.forEach((cur) => {
      cur.ref.delete();
    });
    res.status(200).json({ msg: 'ORDER_CANCELLED' });
  } catch (e) {
    res.status(400).send(`${e.message}`);
  }
});

app.post('/api/verifyAuth', async (req, res) => {
  const {
    cookies: { token },
  } = req.body;
  console.log('token ->>>>>>>>>>>>>>>>>', token);
  try {
    const response = await firebaseAdmin.auth().verifyIdToken(token);
    console.log('response----------->', response);
    res.status(200).json(response);
  } catch (error) {
    console.log('error token validation');
    res.status(400).json({ msg: 'AUTH_FAILED' });
  }
});

app.get('/api/getAuth', async (req, res) => {
  try {
    const authUser = auth.currentUser;
    const user = {
      uid: authUser.uid,
      displayName: authUser.displayName,
      email: authUser.email,
      phoneNumber: authUser.phoneNumber,
    };
    res.status(200).json({ user });
  } catch (e) {
    res.status(400).send(e);
  }
});

app.listen(port, () => {
  console.log('Server started');
});
