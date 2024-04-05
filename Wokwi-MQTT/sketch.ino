#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

#define RELAY_PIN 4 

DHT dht(2, DHT22);
float temperature;
float humidity;

const char* ssid = "Wokwi-GUEST"; 
const char* password = "";       
const char* mqtt_server = "broker.emqx.io"; 

const char* control_topic = "/64053441/control_relay";

WiFiClient espClient;
PubSubClient client(espClient);

bool relayState = false;

void setup_wifi() {

  Serial.println();
  Serial.print("Connecting to WiFi... ");

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("WiFi connected");
  
}

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");

  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.println(message);

  if (message.equalsIgnoreCase("on")) {
    relayState = true;
    digitalWrite(RELAY_PIN, HIGH);
    Serial.println("Relay turned ON");
  } else if (message.equalsIgnoreCase("off")) {
    relayState = false;
    digitalWrite(RELAY_PIN, LOW);
    Serial.println("Relay turned OFF");
  }
}

void reconnect() {
  // Loop until connected to the MQTT broker
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "ESP8266Client-MyClient";

    if (client.connect(clientId.c_str(), "YOUR_USERNAME", "YOUR_PASSWORD")) {
      Serial.println("connected");
      client.subscribe(control_topic); // Subscribe to the control topic
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  setup_wifi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);

  pinMode(RELAY_PIN, OUTPUT); 
  digitalWrite(RELAY_PIN, LOW);
}

void loop() {
  temperature = dht.readTemperature();
  humidity = dht.readHumidity();

  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Failed to read from DHT sensor!");
    return; 
  }

  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  client.publish("/64053441/temp", String(temperature).c_str());
  client.publish("/64053441/humi", String(humidity).c_str());

  Serial.print("Temperature: ");
  Serial.println(temperature);
  Serial.print("Humidity: ");
  Serial.println(humidity);

  delay(2000);
}
