void setup() {
  pinMode(4, INPUT_PULLUP);
  pinMode(5, OUTPUT);
}

void loop() {
  if (!digitalRead(4)) digitalWrite(5, HIGH);
  else digitalWrite(5, LOW);
}
