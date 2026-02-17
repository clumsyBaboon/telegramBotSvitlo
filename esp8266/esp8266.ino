#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ESP8266HTTPClient.h>
#include <LittleFS.h>

#define BTN_PIN 4
#define LED_PIN 5

String _ssid, _pass, _device;
const String serverUrl = "https://telegrambotsvitlo.onrender.com/ping";
bool isPassOkay = false;

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
    html += "Device ID: <br><input type='text' name='device'><br><br>";
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

    Serial.println("\n\nFile loaded! SSID: " + _ssid + " PASS: " + _pass + " DEVICE: " + _device);
    if (_pass.length() >= 8 && _ssid != "") isPassOkay = true;

    connectWiFi(_ssid.c_str(), _pass.c_str());
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

void loop() {
  static uint32_t lastPing = 0;
  static const uint32_t pingInterval = 30000;

  uint32_t now = millis();
  if (now - lastPing > pingInterval) {
    lastPing = now;

    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      WiFiClient client;

      String fullURL = serverUrl + "?device_id=" + _device;
      
      if (http.begin(client, fullURL)) {
        uint16_t httpCode = http.GET();

        if (httpCode > 0) {
          Serial.println("[HTTP] GET... code: " + String(httpCode));
          if (httpCode == HTTP_CODE_OK) {
            String payload = http.getString();
            Serial.print("Response: ");
            Serial.println(payload);
          }
        } else Serial.println("[HTTP] GET... failed");

        http.end();
      }
    } else Serial.println("WiFi not connected!");
  }
}