import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Alert, ScrollView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api'; // change to your backend URL if different

const defaultInputs = {
  gender: 'male',
  age: '',
  height: '',
  weight: '',
  activityLevel: 'sedentary',
};

export default function MacrosPage() {
  const [inputs, setInputs] = useState(defaultInputs);
  const [macrosResponse, setMacrosResponse] = useState(null);
  const [token, setToken] = useState('');
  const [totals, setTotals] = useState({ protein: 0, fat: 0, carbs: 0, meals: [] });
  const [meal, setMeal] = useState({ name: '', protein: '', fat: '', carbs: '' });
  const [loadingCalc, setLoadingCalc] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('macroInputs');
      const savedToken = await AsyncStorage.getItem('token');
      if (saved) setInputs(JSON.parse(saved));
      if (savedToken) setToken(savedToken);
    })();
  }, []);

  useEffect(() => {
    if (token) {
      axios.get(`${API_URL}/macros/today`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => setTotals(r.data))
        .catch(() => setTotals({ protein: 0, fat: 0, carbs: 0, meals: [] }));
    }
  }, [token]);

  const saveInputsAndCalc = async () => {
    const age = Number(inputs.age);
    const height = Number(inputs.height);
    const weight = Number(inputs.weight);
    if (!['male', 'female'].includes(inputs.gender)) return Alert.alert('Gender must be "male" or "female"');
    if (Number.isNaN(age) || Number.isNaN(height) || Number.isNaN(weight)) return Alert.alert('Enter valid numbers');

    setLoadingCalc(true);
    try {
      const res = await axios.post(`${API_URL}/nutritive/calculate`, { ...inputs, age, height, weight });
      setMacrosResponse(res.data);
      await AsyncStorage.setItem('macroInputs', JSON.stringify(inputs));
    } catch (err) {
      Alert.alert('Calculation failed', err?.response?.data?.error || err.message);
    } finally {
      setLoadingCalc(false);
    }
  };

  const submitMeal = async () => {
    if (!token) return Alert.alert('Please login to save meals');
    const p = Number(meal.protein) || 0;
    const f = Number(meal.fat) || 0;
    const c = Number(meal.carbs) || 0;
    if (p < 0 || f < 0 || c < 0) return Alert.alert('Enter non-negative values');
    try {
      const res = await axios.post(`${API_URL}/macros/log`, { protein: p, fat: f, carbs: c, mealName: meal.name }, { headers: { Authorization: `Bearer ${token}` } });
      setTotals(res.data);
      setMeal({ name: '', protein: '', fat: '', carbs: '' });
    } catch (err) {
      Alert.alert('Error logging meal', err?.response?.data?.error || err.message);
    }
  };

  const percent = (have, need) => {
    if (!need) return 0;
    return Math.min(100, Math.round((have / need) * 100));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Daily Macro Calculator & Tracker</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1) Enter personal data (first visit)</Text>
        <TextInput placeholder="Gender (male/female)" value={inputs.gender} onChangeText={v => setInputs(s => ({ ...s, gender: v }))} style={styles.input} />
        <TextInput placeholder="Age" keyboardType="numeric" value={inputs.age} onChangeText={v => setInputs(s => ({ ...s, age: v }))} style={styles.input} />
        <TextInput placeholder="Height (cm)" keyboardType="numeric" value={inputs.height} onChangeText={v => setInputs(s => ({ ...s, height: v }))} style={styles.input} />
        <TextInput placeholder="Weight (kg)" keyboardType="numeric" value={inputs.weight} onChangeText={v => setInputs(s => ({ ...s, weight: v }))} style={styles.input} />
        <TextInput placeholder="Activity level (sedentary, light, moderate, active, very_active)" value={inputs.activityLevel} onChangeText={v => setInputs(s => ({ ...s, activityLevel: v }))} style={styles.input} />
        <Button title={loadingCalc ? 'Calculating...' : 'Calculate BMR / TDEE / Macros'} onPress={saveInputsAndCalc} />
      </View>

      {macrosResponse && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2) Results with formulas</Text>
          <Text style={styles.mono}>Inputs: weight={macrosResponse.inputs.weight}kg, height={macrosResponse.inputs.height}cm, age={macrosResponse.inputs.age}y, PAL={macrosResponse.inputs.pal}</Text>
          <Text style={styles.bold}>Mifflin–St Jeor BMR</Text>
          <Text>{macrosResponse.formulas.mifflin_st_jeor.latex}</Text>
          <Text style={styles.result}>BMR ≈ {macrosResponse.formulas.mifflin_st_jeor.computed} kcal</Text>

          <Text style={styles.bold}>Harris–Benedict (revised) BMR</Text>
          <Text>{macrosResponse.formulas.harris_benedict.latex}</Text>
          <Text style={styles.result}>HB BMR ≈ {macrosResponse.formulas.harris_benedict.computed} kcal</Text>

          <Text style={styles.bold}>TDEE</Text>
          <Text>{macrosResponse.formulas.tdee.latex} (PAL × BMR)</Text>
          <Text style={styles.result}>TDEE ≈ {macrosResponse.formulas.tdee.computed} kcal</Text>

          <Text style={styles.bold}>Recommended daily macros (by grams)</Text>
          <Text>Protein: {macrosResponse.macros.protein_g} g ({Math.round(macrosResponse.macros.protein_pct * 100)}%)</Text>
          <Text>Fat: {macrosResponse.macros.fat_g} g ({Math.round(macrosResponse.macros.fat_pct * 100)}%)</Text>
          <Text>Carbs: {macrosResponse.macros.carbs_g} g ({Math.round(macrosResponse.macros.carbs_pct * 100)}%)</Text>

          <Text style={styles.small}>Protein recommendation per kg: {macrosResponse.protein_per_kg.range_g_per_kg[0]}–{macrosResponse.protein_per_kg.range_g_per_kg[1]} g/kg</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3) Log a meal (anytime)</Text>
        <TextInput placeholder="Meal name" value={meal.name} onChangeText={v => setMeal(m => ({ ...m, name: v }))} style={styles.input} />
        <TextInput placeholder="Protein (g)" keyboardType="numeric" value={meal.protein} onChangeText={v => setMeal(m => ({ ...m, protein: v }))} style={styles.input} />
        <TextInput placeholder="Fat (g)" keyboardType="numeric" value={meal.fat} onChangeText={v => setMeal(m => ({ ...m, fat: v }))} style={styles.input} />
        <TextInput placeholder="Carbs (g)" keyboardType="numeric" value={meal.carbs} onChangeText={v => setMeal(m => ({ ...m, carbs: v }))} style={styles.input} />
        <Button title="Add Meal" onPress={submitMeal} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4) Today's totals & warnings</Text>
        <Text>Protein: {totals.protein} g {macrosResponse ? `/ ${macrosResponse.macros.protein_g} g` : ''} ({macrosResponse ? percent(totals.protein, macrosResponse.macros.protein_g) : 0}%)</Text>
        <Text>Fat: {totals.fat} g {macrosResponse ? `/ ${macrosResponse.macros.fat_g} g` : ''} ({macrosResponse ? percent(totals.fat, macrosResponse.macros.fat_g) : 0}%)</Text>
        <Text>Carbs: {totals.carbs} g {macrosResponse ? `/ ${macrosResponse.macros.carbs_g} g` : ''} ({macrosResponse ? percent(totals.carbs, macrosResponse.macros.carbs_g) : 0}%)</Text>

        {macrosResponse && (
          <View style={{ marginTop: 8 }}>
            {totals.protein > macrosResponse.macros.protein_g && <Text style={styles.warn}>Protein exceeded!</Text>}
            {totals.fat > macrosResponse.macros.fat_g && <Text style={styles.warn}>Fat exceeded!</Text>}
            {totals.carbs > macrosResponse.macros.carbs_g && <Text style={styles.warn}>Carbohydrates exceeded!</Text>}
          </View>
        )}

        <View style={{ marginTop: 8 }}>
          <Text style={styles.sub}>Logged meals today:</Text>
          {totals.meals && totals.meals.length ? totals.meals.map((m, i) => (
            <View key={i} style={{ marginTop: 4 }}>
              <Text>{m.name}: P {m.protein}g / F {m.fat}g / C {m.carbs}g</Text>
            </View>
          )) : <Text style={styles.small}>No meals logged yet.</Text>}
        </View>
      </View>

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  section: { marginBottom: 16 },
  sectionTitle: { fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 8, borderRadius: 6 },
  mono: { fontFamily: 'monospace', marginBottom: 6 },
  bold: { fontWeight: '700', marginTop: 8 },
  result: { fontWeight: '700', marginBottom: 6 },
  small: { fontSize: 12, color: '#666' },
  warn: { color: 'red', fontWeight: '700' },
  sub: { fontWeight: '600' }
});
