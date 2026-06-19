// src/navigation/AppNavigator.js
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import { colors, font, radius } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { getStr } from '../i18n/strings';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import MaterialsScreen from '../screens/MaterialsScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddMaterialScreen from '../screens/AddMaterialScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import AddContractorPaymentScreen from '../screens/AddContractorPaymentScreen';
import MaterialDetailScreen from '../screens/MaterialDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function CustomTabBar({ state, descriptors, navigation }) {
  const { language } = useApp();
  const s = (key) => getStr(language, key);

  const tabs = [
    { name: 'Dashboard', icon: 'home', label: s('dashboard') },
    { name: 'Materials', icon: 'cube', label: s('materials') },
    { name: 'Reports', icon: 'bar-chart', label: s('reports') },
    { name: 'Settings', icon: 'settings', label: s('settings') },
  ];

  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const tab = tabs[index];
        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={() => {
              if (!isFocused) navigation.navigate(route.name);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.tabIconWrap, isFocused && styles.tabIconWrapActive]}>
              <Ionicons
                name={isFocused ? tab.icon : `${tab.icon}-outline`}
                size={22}
                color={isFocused ? colors.textOnAmber : colors.textMuted}
              />
            </View>
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Materials" component={MaterialsScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isLoading } = useApp();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading]);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: true, cardStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="AddMaterial"
          component={AddMaterialScreen}
          options={{ presentation: 'modal', gestureEnabled: true }}
        />
        <Stack.Screen
          name="AddExpense"
          component={AddExpenseScreen}
          options={{ presentation: 'modal', gestureEnabled: true }}
        />
        <Stack.Screen
          name="AddContractorPayment"
          component={AddContractorPaymentScreen}
          options={{ presentation: 'modal', gestureEnabled: true }}
        />
        <Stack.Screen name="MaterialDetail" component={MaterialDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    paddingBottom: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  tabIconWrap: {
    width: 44,
    height: 32,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconWrapActive: {
    backgroundColor: colors.amber,
  },
  tabLabel: {
    fontSize: font.xs,
    color: colors.textMuted,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: colors.amber,
  },
});
