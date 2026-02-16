#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <LittleFS.h>

#define BTN_PIN 4
#define LED_PIN 5

ESP8266WebServer* server = nullptr;

void setup() {
  pinMode(BTN_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);

  Serial.begin(115200);
  LittleFS.begin();

  delay(200);

  if (!digitalRead(BTN_PIN)) runConfigMode();
}

void runConfigMode() {
  Serial.println("\n============== CONFIG MODE ==============");
  uint16_t port = 80;
  if (LittleFS.exists("/port.txt")) {
    File file = LittleFS.open("/port.txt", "r");
    String savedPort = file.readStringUntil('/n');
    port = savedPort.toInt();
    file.close();
  }
  Serial.println("PORT: " + String(port));
}

void loop() {
  
}
