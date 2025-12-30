import {
  Image,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import "../global.css";
import axiosinstance from "../axiosconfig";
import { useEffect, useState } from "react";

export default function Index() {
  const [isSpray, setIsSpray] = useState(false);
  const [isSeed, setIsSeed] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "checking"
  >("checking");
  const [imageError, setImageError] = useState(false);

    const getServerCommand = (cmd: string) => {
    switch (cmd) {
      case "auto":
        return { "0":"auto" };
      case "up":
        return { "0": "forward" };
      case "down":
        return { "0": "reverse" };
      case "left":
        return { "0": "turn_left" };
      case "right":
        return { "0": "turn_right" };
      case "stop":
        return { "0": "stop" };
      case "sprayon":
        return { "2": "ON" };
      case "sprayoff":
        return { "2": "OFF" };
      case "seedon":
        return { "1": "ON" };
      case "seedoff":
        return { "1": "OFF" };
      default:
        return {};
    }
  };
   
  const handleButtonPress = async (cmd: string) => {
  
    try {
       let servercmd = getServerCommand(cmd)
      const res = await axiosinstance.post("/json", {
        cmd: servercmd,
      });
      console.log(res.data);
      setConnectionStatus("connected");
      return true
    } catch (error) {
      console.log("Error sending command:", error);
      setConnectionStatus("disconnected");
      Alert.alert("Connection Error", "Failed to send command to AgriBot");
      return false
    } finally {
      setIsLoading(false);
    }
  };

  const fetchImage = async () => {
    try {
      setImageError(false);
      const response = await fetch("http://raspberrypi.local:5000/get-image");

      if (!response.ok) {
        throw new Error("Failed to fetch image");
      }

      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = () => {
        setImageUrl(reader.result as string);
        setConnectionStatus("connected");
      };

      reader.onerror = () => {
        setImageError(true);
        setConnectionStatus("disconnected");
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      console.log("Error fetching image:", error);
      setImageError(true);
      setConnectionStatus("disconnected");
    }
  };

  const refreshImage = () => {
    fetchImage();
  };

  useEffect(() => {
    fetchImage();
    // const interval = setInterval(() => {
    //   fetchImage();
    // }, 5000); // Fetch image every 5 seconds
    // return () => clearInterval(interval);
  }, []);

  const ControlButton = ({
    onPress,
    iconName,
    size = 80,
    color = "#374151",
    disabled = false,
  }: {
    onPress: () => void;
    iconName: string;
    size?: number;
    color?: string;
    disabled?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
    //  disabled={disabled || isLoading}
      className={`p-3 rounded-full shadow-lg ${
        disabled || isLoading ? "bg-gray-300" : "bg-white"
      } border border-gray-200 active:bg-gray-100`}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <MaterialCommunityIcons
        name={iconName as any}
        size={size}
        color={disabled || isLoading ? "#9CA3AF" : color}
      />
    </TouchableOpacity>
  );

  const ActionButton = ({
    onPress,
    iconName,
    isActive,
    label,
    size = 70,
  }: {
    onPress: () => void;
    iconName: string;
    isActive: boolean;
    label: string;
    size?: number;
  }) => (
    <View className="items-center">
      <TouchableOpacity
        onPress={onPress}
        disabled={isLoading}
        className={`p-4 rounded-full shadow-lg border-2 ${
          isActive
            ? "bg-green-600 border-green-700"
            : "bg-white border-gray-300"
        } ${isLoading ? "opacity-50" : ""}`}
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: 4,
        }}
      >
        <MaterialCommunityIcons
          name={iconName as any}
          size={size}
          color={isActive ? "white" : "#374151"}
        />
      </TouchableOpacity>
      <Text
        className={`mt-2 text-sm font-medium ${
          isActive ? "text-green-700" : "text-gray-600"
        }`}
      >
        {label}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50 px-4">
      {/* Header */}
      <View className="py-4 flex flex-row items-center justify-between">
        <View className="flex flex-row items-center gap-2">
          <MaterialCommunityIcons name="leaf" size={32} color="#16a34a" />
          <Text className="text-2xl font-bold text-green-600">Agri</Text>
          <Text className="text-2xl font-bold text-gray-800">Bot</Text>
        </View>

        {/* Connection Status */}
        <View className="flex flex-row items-center gap-2">
          <View
            className={`w-3 h-3 rounded-full ${
              connectionStatus === "connected"
                ? "bg-green-500"
                : connectionStatus === "disconnected"
                  ? "bg-red-500"
                  : "bg-yellow-500"
            }`}
          />
          <Text
            className={`text-sm font-medium ${
              connectionStatus === "connected"
                ? "text-green-600"
                : connectionStatus === "disconnected"
                  ? "text-red-600"
                  : "text-yellow-600"
            }`}
          >
            {connectionStatus === "connected"
              ? "Connected"
              : connectionStatus === "disconnected"
                ? "Offline"
                : "Connecting..."}
          </Text>
        </View>
      </View>

      {/* Camera Feed Section */}
      <View className="mb-6">
        <View className="flex flex-row items-center justify-between mb-3">
          <Text className="text-lg font-semibold text-gray-800">
            Live Camera Feed
          </Text>
          <TouchableOpacity
            onPress={refreshImage}
            className="p-2 rounded-full bg-white shadow-sm border border-gray-200"
          >
            <MaterialCommunityIcons name="refresh" size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        <View className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {imageUrl && !imageError ? (
            <Image
              source={{ uri: imageUrl }}
              className="w-full h-64 rounded-xl"
              style={{ resizeMode: "cover" }}
              onError={() => setImageError(true)}
            />
          ) : (
            <View className="bg-gray-100 items-center justify-center h-64 rounded-xl">
              {imageError ? (
                <View className="items-center">
                  <MaterialCommunityIcons
                    name="camera-off"
                    size={48}
                    color="#9CA3AF"
                  />
                  <Text className="text-gray-500 mt-2">Camera Unavailable</Text>
                  <TouchableOpacity
                    onPress={refreshImage}
                    className="mt-2 px-4 py-2 bg-green-600 rounded-lg"
                  >
                    <Text className="text-white font-medium">Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="items-center">
                  <ActivityIndicator size="large" color="#16a34a" />
                  <Text className="text-gray-500 mt-2">Loading Camera...</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Controls Section */}
      <View className="flex-1">
        <Text className="text-lg font-semibold text-gray-800 mb-4">
          Rover Controls
        </Text>

        <View className=" justify-between items-center">
          {/* Movement Controls */}
          <View className=" items-center">
            <Text className="text-sm font-medium text-gray-600 mb-4">
              Movement
            </Text>

            {/* Up Button */}
            <ControlButton
              onPress={() => handleButtonPress("up")}
              iconName="chevron-up"
              size={60}
              color="#16a34a"
            />

            {/* Left, Stop, Right */}
            <View className="flex flex-row items-center my-2">
              <ControlButton
                onPress={() => handleButtonPress("left")}
                iconName="chevron-left"
                size={60}
                color="#16a34a"
              />

              <View className="mx-2">
                <TouchableOpacity
                  onPress={() => handleButtonPress("stop")}
                  disabled={isLoading}
                  className={`p-4 rounded-full shadow-lg border-2 ${
                    isLoading
                      ? "bg-gray-300 border-gray-400"
                      : "bg-red-500 border-red-600"
                  }`}
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    elevation: 4,
                  }}
                >
                  <MaterialCommunityIcons name="stop" size={40} color="white" />
                </TouchableOpacity>
              </View>

              <ControlButton
                onPress={() => handleButtonPress("right")}
                iconName="chevron-right"
                size={60}
                color="#16a34a"
              />
            </View>

            {/* Down Button */}
            <ControlButton
              onPress={() => handleButtonPress("down")}
              iconName="chevron-down"
              size={60}
              color="#16a34a"
            />
          </View>

          {/* Action Controls */}
          <View className=" items-center ">
            <Text className="text-sm font-medium text-gray-600 mt-3 mb-4">
              Actions
            </Text>
            <View className="flex flex-row gap-6 items-center">
             <ActionButton
                onPress={() => {
                  if (isAutoMode) {
                    setIsAutoMode(false);
                    handleButtonPress("stop");
                  }else{
                    setIsAutoMode(true);
                    handleButtonPress("auto");     
                  }
                }}
                 iconName="grass"
                isActive={isAutoMode}
                label={isAutoMode ? "Stop Weeding" : "Start Weeding"}
                size={40}
                  />

              <ActionButton
                onPress={() => {
                  if (isSpray) {
                     handleButtonPress("sprayoff");
                    setIsSpray(false);
                  } else {
                    setIsSpray(true);
                    handleButtonPress("sprayon");
                  }
                }}
                iconName="watering-can"
                isActive={isSpray}
                label={isSpray ? "Stop Spray" : "Start Spray"}
                size={40}
              />

              <ActionButton
                onPress={() => {
                  if (isSeed) {
                    setIsSeed(false);
                    handleButtonPress("seedoff");
                  } else {
                    setIsSeed(true);
                    handleButtonPress("seedon");
                  }
                }}
                iconName="seed"
                isActive={isSeed}
                label={isSeed ? "Stop Seeding" : "Start Seeding"}
                size={40}
              />
            </View>
          </View>
        </View>

        {/* Loading Indicator */}
        {isLoading && (
          <View className="absolute bottom-4 left-0 right-0 items-center">
            <View className="bg-white px-4 py-2 rounded-full shadow-lg border border-gray-200 flex flex-row items-center gap-2">
              <ActivityIndicator size="small" color="#16a34a" />
              <Text className="text-gray-700 font-medium">
                Sending Command...
              </Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
