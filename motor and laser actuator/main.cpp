#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <ESPmDNS.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>

// WiFi credentials
const char* ssid = "Redmi_Note_10_Pro";
const char* password = "12345678";

// Hardware definitions
#define RELAY1 32
#define RELAY2 33
#define RELAY3 25
#define RELAY4 26
#define RELAY5 27
#define RELAY6 14
#define servo_1_pin 12
#define servo_2_pin 13

Servo servo_1;
Servo servo_2;

// Shared data and mutex
SemaphoreHandle_t mutex;
TaskHandle_t Task1;
volatile int cutoff_time = 0;

String data[5] = {"stop", "OFF", "OFF", "90", "90"}; // move, feede, pump, servo1, servo2

AsyncWebServer server(3001);

// Motor safety cutoff task
void motor_cutoff(void *pvParameters) {
  (void) pvParameters;
  while (1) {
    bool needExecute = false;
    boolean check = false;
    if(xSemaphoreTake(mutex, portMAX_DELAY)) {
      if(cutoff_time > 0){
        cutoff_time -= 100;
        check = true;
      }
      if(cutoff_time <= 1){
        data = "stop";
        needExecute = true;
      }
      xSemaphoreGive(mutex);
    }
    if(needExecute && check) {
      execute();
    }
    vTaskDelay(pdMS_TO_TICKS(100));
  }
}

// Value validity check
bool check_value(int index_ID, String value){
  if(index_ID==0 && (value=="forward"||value=="reverse"||value=="turn_right"||value=="turn_left")){
    if(xSemaphoreTake(mutex, portMAX_DELAY)) {
      cutoff_time = 2000;
      xSemaphoreGive(mutex);
    }
    return true;
  }
  if((index_ID==1||index_ID==2) && (value=="ON"||value=="OFF")) return true;
  if((index_ID==3||index_ID==4) && (value.toInt()>=0 && value.toInt()<=180)) return true;
  return false;
}

// Command executor
void execute(){
  if(xSemaphoreTake(mutex, portMAX_DELAY)) {
    if(data[0] == "forward"){
      digitalWrite(RELAY1, LOW);  digitalWrite(RELAY2, HIGH);
      digitalWrite(RELAY3, LOW);  digitalWrite(RELAY4, HIGH);
      Serial.print("moving forward  |");
    }else if(data == "reverse"){
      digitalWrite(RELAY1, HIGH);  digitalWrite(RELAY2, LOW);
      digitalWrite(RELAY3, HIGH);  digitalWrite(RELAY4, LOW);
      Serial.print("moving reverse  |");
    }else if(data == "turn_right"){
      digitalWrite(RELAY1, LOW);   digitalWrite(RELAY2, HIGH);
      digitalWrite(RELAY3, HIGH);  digitalWrite(RELAY4, LOW);
      Serial.print("moving right    |");
    }else if(data == "turn_left"){
      digitalWrite(RELAY1, HIGH);  digitalWrite(RELAY2, LOW);
      digitalWrite(RELAY3, LOW);   digitalWrite(RELAY4, HIGH);
      Serial.print("moving left     |");
    }else{
      digitalWrite(RELAY1, HIGH);  digitalWrite(RELAY2, HIGH);
      digitalWrite(RELAY3, HIGH);  digitalWrite(RELAY4, HIGH);
      Serial.print("IDLE            |");
    }

    if(data == "ON"){
      digitalWrite(RELAY5, LOW);  Serial.print(" seed_feeder - ON  |");
    }else{
      digitalWrite(RELAY5, HIGH); Serial.print(" seed_feeder - OFF |");
    }

    if(data == "ON"){
      digitalWrite(RELAY6, LOW);  Serial.print(" pump - ON  |");
    }else{
      digitalWrite(RELAY6, HIGH); Serial.print(" pump - OFF |");
    }

    servo_1.write(data.toInt());
    Serial.print(" Servo_1 moved to: "); Serial.print(data.toInt());

    servo_2.write(data.toInt());
    Serial.print(" | Servo_2 moved to: "); Serial.print(data.toInt());

    xSemaphoreGive(mutex);
  }
  Serial.println();
}

void setup() {
  Serial.begin(115200);

  pinMode(RELAY1, OUTPUT); pinMode(RELAY2, OUTPUT);
  pinMode(RELAY3, OUTPUT); pinMode(RELAY4, OUTPUT);
  pinMode(RELAY5, OUTPUT); pinMode(RELAY6, OUTPUT);

  digitalWrite(RELAY1, HIGH); digitalWrite(RELAY2, HIGH);
  digitalWrite(RELAY3, HIGH); digitalWrite(RELAY4, HIGH);
  digitalWrite(RELAY5, HIGH); digitalWrite(RELAY6, HIGH);

  servo_1.attach(servo_1_pin, 500, 2400);
  servo_2.attach(servo_2_pin, 500, 2400);

  mutex = xSemaphoreCreateMutex();
  xTaskCreate(motor_cutoff, "Timer", 2048, NULL, 1, &Task1);

  // Connect to WiFi
  WiFi.begin(ssid, password);
  while(WiFi.status() != WL_CONNECTED){
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("WiFi connected: " + WiFi.localIP().toString());

  // Start mDNS
  if(MDNS.begin("agribot")) Serial.println("mDNS responder started");
  else Serial.println("Error setting up MDNS responder!");

  // POST /cmd handler
  server.on("/cmd", HTTP_POST, [](AsyncWebServerRequest *request){},
    NULL, // no file upload
    [](AsyncWebServerRequest request, uint8_t data_ptr, size_t len, size_t index, size_t total)
    {
      DynamicJsonDocument doc(256);
      DeserializationError error = deserializeJson(doc, data_ptr, len);

      String replyJson;
      if(error){
        replyJson = "{\"error\":\"Invalid JSON\"}";
        request->send(400, "application/json", replyJson);
        return;
      }
      // Read and validate
      int index_ID = doc["index_ID"] | -1;
      String value = String((const char*)doc["value"] | "");

      if( index_ID < 0 || index_ID > 4 ) {
        replyJson = "{\"error\":\"Invalid index_ID\"}";
        request->send(400, "application/json", replyJson);
        return;
      }
      if( !check_value(index_ID, value) ) {
        replyJson = "{\"error\":\"Invalid value\"}";
        request->send(400, "application/json", replyJson);
        return;
      }
      // Valid, update shared data
      if(xSemaphoreTake(mutex, portMAX_DELAY)) {
        data[index_ID] = value;
        xSemaphoreGive(mutex);
      }
      execute();
      replyJson = "{\"status\":\"updated\"}";
      request->send(200, "application/json", replyJson);
    });

  server.begin();
  Serial.println("Async server started on port 3001");
}

void loop() {
  // nothing; all work is async
}