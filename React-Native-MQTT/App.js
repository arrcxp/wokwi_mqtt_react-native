import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@rneui/themed';
import React, {useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import init from 'react_native_mqtt';

let topicPub  = '/64053441/control_relay';
let topicSub1 = '/64053441/temp';
let topicSub2 = '/64053441/humi';

// Create a client instance
init({
  size: 10000,
  storageBackend: AsyncStorage,
  defaultExpires: 1000 * 3600 * 24,
  enableCache: true,
  sync: {},
});

const options = {
  host: 'broker.emqx.io',
  port: 8083,
  id: 'id_' + parseInt(Math.random() * 100000),
};

let client = new Paho.MQTT.Client(options.host, options.port, options.id);

const App = () => {
  const [isOnPressed, setIsOnPressed] = useState(false);
  const [isOffPressed, setIsOffPressed] = useState(false);
  const [temperature, setTemperature] = useState('');
  const [humidity, setHumidity] = useState('');

  useEffect(() => {
    client.connect({onSuccess: onConnect});

    function onConnect() {
      console.log('Connected to MQTT broker');
      client.subscribe(topicPub);
      client.subscribe(topicSub1);
      client.subscribe(topicSub2);
    }

    client.onMessageArrived = onMessageArrived;

    function onMessageArrived(message) {
      console.log('Received message:', message.payloadString);
      if (message.destinationName === topicSub1) {
        setTemperature(message.payloadString);
      } else if (message.destinationName === topicSub2) {
        setHumidity(message.payloadString);
      } else if (message.destinationName === topicPub) {
      }
    }

    return () => {
      client.disconnect();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.textHead}>DHT-SENSOR</Text>
      <View style={{ width: 200, height: 2, backgroundColor: '#000' }}></View>
      <View style={styles.box1}>
        <Text style={styles.texttH}>Temperature</Text>
        <Text style={styles.texttS}> { temperature } °C </Text>
      </View>

      <View style={styles.box1}>
        <Text style={styles.texttH}>Humidity</Text>
        <Text style={styles.texttS}> { humidity } % </Text>
      </View>

      <View style={{ width: 150, height: 2, backgroundColor: '#000', marginTop: 16, marginBottom: -24 }}></View>

      <View style={styles.buttonContainer}>
        <Button
          buttonStyle={[
            styles.btn,
            {
              backgroundColor: isOnPressed ? '#fff' : '#000',
              borderColor: isOnPressed ? '#000' : '#fff',
              borderWidth: 2,
            },
          ]}

          title="ON"
          titleStyle={{
            color: isOnPressed ? '#000' : '#fff',
            fontSize: 30,
            fontWeight: 'bold',
          }}
          onPress={() => {
            setIsOnPressed(true);
            setIsOffPressed(false);
            client.publish('/64053441/control_relay', 'on');
          }}
        />

        <Button
          buttonStyle={[ styles.btn, {
              backgroundColor: isOnPressed ? '#000' : '#fff',
              borderColor: isOnPressed ? '#fff' : '#000',
              borderWidth: 2,
            },
          ]}
          
          title="OFF"
          titleStyle={{
            color: isOnPressed ? '#fff' : '#000',
            fontSize: 30,
            fontWeight: 'bold',
          }}
          onPress={() => {
            setIsOnPressed(false);
            setIsOffPressed(true);
            client.publish('/64053441/control_relay', 'off');
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  textHead: {
    color: '#000',
    fontSize: 32,
    fontWeight: 'bold',
  },  

  box1: {
    width: 355,
    height: 120,
    backgroundColor: '#000',
    justifyContent: 'center',
    marginTop: 20,
    borderRadius: 24,
  },

  box2: {
    width: 380,
    height: 100,
    marginTop: 30,
    backgroundColor: '#27374D',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    borderRadius: 10,
  },

  buttonContainer: {
    flexDirection: 'row',
    marginTop: 40,
  },

  texttH: {
    fontSize: 25,
    color: '#DDE6ED',
    marginLeft: 30
  },

  texttS: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#DDE6ED',
    marginLeft: 30
  },

  btn: {
    width: 170,
    height: 60,
    borderRadius: 32,
  },
});

export default App;
