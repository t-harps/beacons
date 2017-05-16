import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  AsyncStorage,
  Text,
  Image,
  TouchableNativeFeedback,
  Alert,
  ActivityIndicator,
  View
} from 'react-native';

import * as firebase from 'firebase'
import { MKButton, MKColor } from 'react-native-material-kit';

const t = require('tcomb-form-native');

const Form = t.form.Form;

const Person = t.struct({
  name: (t.String)
});

const options = {
  fields:{
    name: {
      underlineColorAndroid: 'transparent'
    }  
  }
}

const firebaseConfig = {
  apiKey: "AIzaSyA67RDUDWBN9B5km2uWx7G8vpF2D7xqKAk",
  authDomain: "beacons-1e684.firebaseapp.com",
  databaseURL: "https://beacons-1e684.firebaseio.com",
  storageBucket: "beacons-1e684.appspot.com",
  messagingSenderId: "486540616489"
};
const firebaseApp = firebase.initializeApp(firebaseConfig);
var itemsRef = firebaseApp.database().ref();

const Beacons = React.createClass({
  getInitialState(){
    this.getUser();
    return {
      loggedIn: false,
      loading: true,
      lighters: []
    }
  },

  componentDidMount() {
    this.listenForItems(itemsRef);
  },

  async getUser(){
    let user = {}
    try {
      await AsyncStorage.getItem('@BeaconsDB:user', (err, result) => {
        if(result){
          user = JSON.parse(result);
          this.setState({loggedIn: true, user: user})
        } else {
          this.setState({loggedIn: false, loading: false});
        }
      });
    } catch (error) {
      this.setState({loggedIn: false, loading: false});
    }
  },

  async saveUser(user) {
    try {
      await AsyncStorage.setItem('@BeaconsDB:user', JSON.stringify(user));
    } catch (error) {
      console.log('error saving data'+error);
    }
  },

  login(){
    const person = this.refs.form.getValue();
    if(person){
      this.saveUser(person);
      this.setState({loggedIn: true, user: person});
    }
  },

  async logout(){
    try {
      AsyncStorage.getAllKeys((err, keys) => {
        AsyncStorage.multiRemove(keys);
      });
      this.setState({loggedIn: false});
    } catch (error) {
    }
  },

  listenForItems(itemsRef) {
    itemsRef.on('value', (snap) => {
      var items = [];
      var toRemove = [];
      snap.forEach((child) => {
        var day = 60*60*24*1000;
        if(((new Date) - new Date(child.val().date)) < day){
          items.push({
            name: child.val().name,
            date: child.val().date,
            _key: child.key
          });
        } else {
          itemsRef.child(child.key).remove();
        }
      });
      this.setState({
        lighters: items,
        loading: false,
      });
    });
  },

  lightBeacon(){
    if(this.state.lighters.find((lighter)=>lighter.name === this.state.user.name)){
      console.log('already lit');
      Alert.alert(
        'Are you sure',
        'Seriously? You slept with someone like 5 minutes ago you slut',
        [
          {text: 'Light em up', onPress: () => itemsRef.push({date: Date(), name: this.state.user.name})},
          {text: 'I pressed it by mistake', onPress: () => console.log('do nothing')},
        ]
      )
    } else {
      itemsRef.push({date: Date(), name: this.state.user.name});
    }
  },
  
  renderLogin(){
    const LoginButton = MKButton.coloredButton().withBackgroundColor(MKColor.Blue).withStyle({width: 200, marginTop: 40}).withText('LOGIN').withOnPress(this.login).build();
    return (
      <View style={styles.container}>
        <Text style={styles.title}>The Beacons</Text>
        <View style={styles.loginForm}>
          <Form
            ref="form"
            type={Person}
            options={options}
          />
        </View>
        <LoginButton/>
      </View>
    );
  },

  renderLighters(){
    if(this.state.lighters.length){
      let lighters = '';
      this.state.lighters.forEach((lighter, index)=>{
        lighters += lighter.name;
        if(index !== this.state.lighters.length-1){
          lighters += ', '
        } else {
          lighters += '.'
        }
      });
      return(
        <View>
          <Text>
            The beacons are lit! Lit by: {lighters}
          </Text>
        </View>
      );
    } else {
      return (
        <View>
          <Text>The beacons are dead and cold</Text>
        </View>
      );
    }
  },

  renderBeacon(){
    if(this.state.lighters.length){
      return (
        <View>
          <TouchableNativeFeedback onPress={() => this.lightBeacon()}>
            <View>
              <Image source={require('./beacon-lit.png')} style={{padding: 20, width: 200, height: 400}} />
            </View>
          </TouchableNativeFeedback>
        </View>
      )
    } else {
      return (
        <View>
          <TouchableNativeFeedback onPress={() => this.lightBeacon()}>
            <View>
              <Image source={require('./beacon-unlit.png')} style={{padding: 20, width: 200, height: 400}} />
            </View>
          </TouchableNativeFeedback>
        </View>
      )
    }
  },

  render() {
    const LogoutButton = MKButton.coloredButton().withBackgroundColor(MKColor.Blue).withText('LOGOUT').withOnPress(this.logout).build();
    if(this.state.loggedIn){
      return (
        <View style={styles.container}>
          <View style={styles.lighters}>
            {this.renderLighters()}
          </View>
          <View style={styles.beacon}>
            {this.renderBeacon()}
          </View>
          <Text></Text>
          <View style={styles.bottom}>
            <LogoutButton/>
          </View>
          <ActivityIndicator
            animating={this.state.loading}
            style={styles.centering}
            size="large"
          />
        </View>
      );
    } else {
      return (
        this.renderLogin()
      );
    }
  },
});

const styles = StyleSheet.create({
  loginForm: {
    width: 200,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    color: 'black',
    alignSelf: 'center',
    marginBottom: 50,
  },
  lighters: {
    marginBottom: 20,
  },
  beacon: {
  },
  centering: {
    alignItems: 'center',
    justifyContent: 'center',
    bottom: 400,
    padding: 8,
  },
  bottom: {
    marginTop: 40,
  }
});

AppRegistry.registerComponent('Beacons', () => Beacons);
