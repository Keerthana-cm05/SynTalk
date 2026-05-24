// ===============================================
// SynTalk Flex Sensor Only Code
// Arduino Uno + 4 Flex Sensors + HM10 + LCD
// MPU6050 REMOVED
// ===============================================

#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <SoftwareSerial.h>

// ================= LCD =================
LiquidCrystal_I2C lcd(0x27, 16, 2);

// ================= HM10 =================
SoftwareSerial btSerial(2, 3); // RX, TX

// ================= FLEX SENSOR PINS =================
const int flexPins[4] = {A0, A1, A2, A3};

// ================= CALIBRATION =================
// STEP 1: Set CALIBRATE_MODE = true, upload, open Serial Monitor
// STEP 2: Flex each finger fully OPEN, note the values printed
// STEP 3: Flex each finger fully CLOSED, note the values printed
// STEP 4: Paste your min/max below, set CALIBRATE_MODE = false
// STEP 5: Upload again — done

const bool CALIBRATE_MODE = false;

// Replace these with YOUR readings from calibration
// Min = finger fully OPEN (flat)
// Max = finger fully CLOSED (bent)
int FLEX_MIN[4] = {20, 10, 20,20};
int FLEX_MAX[4] = {40, 20, 40, 40};

// ================= TIMING =================
unsigned long lastSend        = 0;
unsigned long lastLCDUpdate   = 0;
const int     SEND_INTERVAL   = 50;   // 20Hz — needed for smooth real-time
const int     LCD_INTERVAL    = 400;  // LCD refresh every 400ms

// ================= GESTURE NAME FROM SOFTWARE =================
String currentGesture    = "";
unsigned long gestureTime = 0;
const int GESTURE_TIMEOUT = 3000;  // clear after 3s

// ===================================================
void setup() {

  // ================= SERIAL =================
  Serial.begin(9600);

  // ================= BLUETOOTH =================
  btSerial.begin(9600);

  // ================= LCD =================
  lcd.init();
  lcd.backlight();

  lcd.setCursor(0, 0);
  lcd.print("SynTalk Glove");

  lcd.setCursor(0, 1);
  lcd.print("Starting...");

  delay(2000);
  lcd.clear();

  if (CALIBRATE_MODE) {
    lcd.setCursor(0, 0);
    lcd.print("CALIBRATE MODE");
    lcd.setCursor(0, 1);
    lcd.print("Flex fingers...");
    Serial.println("=== CALIBRATION MODE ===");
    Serial.println("Flex each finger OPEN then CLOSED");
    Serial.println("Note the RAW values printed below");
    Serial.println("FORMAT: I=index M=middle R=ring P=pinky");
    return;
  }

  lcd.setCursor(0, 0);
  lcd.print("SynTalk Ready");
  lcd.setCursor(0, 1);
  lcd.print("Connect glove...");

  Serial.println("System Ready");
}

// ===================================================
void loop() {

  // ── Read incoming gesture name from software ──────────────────
  // The Node.js backend sends back the recognized gesture name
  // over Serial so we can display it on the LCD
  if (Serial.available()) {
    String incoming = Serial.readStringUntil('\n');
    incoming.trim();
    if (incoming.length() > 0 && incoming.charAt(0) != '{') {
      // It's a gesture name, not JSON echo
      currentGesture = incoming.substring(0, 16);
      gestureTime    = millis();
    }
  }

  // Clear gesture after timeout
  if (currentGesture.length() > 0 &&
      millis() - gestureTime > GESTURE_TIMEOUT) {
    currentGesture = "";
  }

  // ── Rate limiting ─────────────────────────────────────────────
  if (millis() - lastSend < SEND_INTERVAL) return;
  lastSend = millis();

  // ── Read flex sensors (raw ADC values) ───────────────────────
  int rawVal[4];
  rawVal[0] = analogRead(A0);
  rawVal[1] = analogRead(A1);
  rawVal[2] = analogRead(A2);
  rawVal[3] = analogRead(A3);

  // ── Calibration mode — just print raw values ─────────────────
  if (CALIBRATE_MODE) {
    if (millis() - lastLCDUpdate > 300) {
      lastLCDUpdate = millis();
      Serial.print("I="); Serial.print(rawVal[0]);
      Serial.print(" M="); Serial.print(rawVal[1]);
      Serial.print(" R="); Serial.print(rawVal[2]);
      Serial.print(" P="); Serial.println(rawVal[3]);
    }
    return;
  }

  // ── Normalize to 0.0 - 1.0 using calibration values ─────────
  float flex[4];
  for (int i = 0; i < 4; i++) {
    flex[i] = constrain(
      (float)(rawVal[i] - FLEX_MIN[i]) /
      (float)(FLEX_MAX[i] - FLEX_MIN[i]),
      0.0, 1.0
    );
  }

  // ── Send JSON to Node.js over USB Serial ─────────────────────
  // Format the software expects:
  // {"f":[thumb, index, middle, ring, pinky], "a":[ax, ay, az]}
  // thumb = 0.0 always (no sensor)
  // accel = [0,0,1] (no MPU, using defaults)
  Serial.print("{\"f\":[0.000,");
  Serial.print(flex[0], 3); Serial.print(",");
  Serial.print(flex[1], 3); Serial.print(",");
  Serial.print(flex[2], 3); Serial.print(",");
  Serial.print(flex[3], 3);
  Serial.print("],\"a\":[0.000,0.000,1.000]}");
  Serial.println();

  // ── Send over Bluetooth (HM-10) ───────────────────────────────
  // Keep your original CSV format for BLE side
  String btData = "";
  btData += String(rawVal[0]) + ",";
  btData += String(rawVal[1]) + ",";
  btData += String(rawVal[2]) + ",";
  btData += String(rawVal[3]);
  btSerial.println(btData);

  // ── Update LCD ────────────────────────────────────────────────
  if (millis() - lastLCDUpdate < LCD_INTERVAL) return;
  lastLCDUpdate = millis();

  lcd.clear();

  if (currentGesture.length() > 0) {
    // Line 1: gesture name
    lcd.setCursor(0, 0);
    lcd.print(currentGesture);

    // Line 2: finger values as bars
    lcd.setCursor(0, 1);
    lcd.print("I");
    lcd.print(printBar(flex[0]));
    lcd.print(" M");
    lcd.print(printBar(flex[1]));
    lcd.print(" R");
    lcd.print(printBar(flex[2]));
    lcd.print(" P");
    lcd.print(printBar(flex[3]));

  } else {
    // Line 1: Index + Middle raw
    lcd.setCursor(0, 0);
    lcd.print("I:");
    lcd.print(rawVal[0]);
    lcd.print(" M:");
    lcd.print(rawVal[1]);

    // Line 2: Ring + Pinky raw
    lcd.setCursor(0, 1);
    lcd.print("R:");
    lcd.print(rawVal[2]);
    lcd.print(" P:");
    lcd.print(rawVal[3]);
  }
}

// ── Helper: flex value → bar character ───────────────────────────────
char printBar(float f) {
  if (f < 0.25) return '_';
  if (f < 0.50) return '-';
  if (f < 0.75) return '=';
  return '#';
}