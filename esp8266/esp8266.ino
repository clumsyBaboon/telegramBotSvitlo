#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <LittleFS.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

#define BTN_PIN 4
#define LED_PIN 5

String _ssid, _pass, _device;
bool isPassOkay = false;

const char* ws_host = "telegrambotsvitlo.onrender.com";
const uint16_t ws_port = 443;

WebSocketsClient webSocket;

ESP8266WebServer* server = nullptr;

void setup() {
  pinMode(BTN_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);

  Serial.begin(115200);
  LittleFS.begin();

  delay(200);

  if (!digitalRead(BTN_PIN)) runConfigMode();
  else runNormalMode();
}

void runConfigMode() {
  Serial.println("\n============== CONFIG MODE ==============");

  WiFi.softAP("ESP_Config_Mode_WiFi", "12345678");
  server = new ESP8266WebServer(80);

  server->on("/", []() {
    String html = "<h2>Device Settings</h2>";
    html += "<form action='/save' method='POST'>";
    html += "WiFi SSID: <br><input type='text' name='ssid'><br><br>";
    html += "WiFi Password: <br><input type='text' name='pass'><br><br>";
    html += "Device ID: <br><input type='number' name='device'><br><br>";
    html += "<input type='submit' value='Save'></form>";
    server->send(200, "text/html", html);
  });

  server->on("/save", []() {
    File file = LittleFS.open("/wifi.txt", "w");
    if (file) {
      file.println(server->arg("ssid"));
      file.println(server->arg("pass"));
      file.println(server->arg("device"));
      file.close();

      server->send(200, "text/plain", "All setting saved!");
    }
  });

  server->begin();

  while (true) {
    server->handleClient();
    yield();
  }
}

void runNormalMode() {
  if (LittleFS.exists("/wifi.txt")) {
    File file = LittleFS.open("/wifi.txt", "r");
    _ssid = file.readStringUntil('\n');
    _ssid.trim();
    _pass = file.readStringUntil('\n');
    _pass.trim();
    _device = file.readStringUntil('\n');
    _device.trim();
    file.close();

    Serial.println("\n\nFile loaded! SSID: " + _ssid + " PASS: " + _pass + " DEVICE:" + _device);
    if (_pass.length() >= 8 && _ssid != "") isPassOkay = true;

    connectWiFi(_ssid.c_str(), _pass.c_str());

    webSocket.beginSSL(ws_host, ws_port, "/");
    webSocket.onEvent(webSocketEvent);
    webSocket.setReconnectInterval(5000);
  }
}

void connectWiFi(const char* ssid, const char* password) {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(false);

  Serial.print("Connecting to WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nConnected!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

void webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED: Serial.println("Websocket disconnected"); break;
    case WStype_CONNECTED: {
      Serial.println("Websocket connected");
      
      StaticJsonDocument<200> doc;
      doc["type"] = "register";
      doc["device_id"] = _device;
      char buffer[200];
      serializeJson(doc, buffer);
      webSocket.sendTXT(buffer);
      break;
    }
    Serial.printf("Received: %s\n", payload);
    default: break;
  }
}

void loop() {
  webSocket.loop();
}