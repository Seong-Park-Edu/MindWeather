import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, DateData } from 'react-native-calendars';
import { useAuth } from '../contexts/AuthContext';
import { getMyEmotions } from '../services/api';
import { EmotionResponse, EmotionColors, EmotionLabels, EmotionIcons } from '../types/emotion';

export default function DiaryScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [emotions, setEmotions] = useState<EmotionResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [markedDates, setMarkedDates] = useState<any>({});
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedEmotion, setSelectedEmotion] = useState<EmotionResponse | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const fetchMonthData = useCallback(async (year: number, month: number) => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getMyEmotions(user.id, year, month);
            setEmotions(data);

            const marks: any = {};
            data.forEach(e => {
                const dateStr = e.createdAt.split('T')[0];
                marks[dateStr] = {
                    marked: true,
                    dotColor: EmotionColors[e.emotion],
                    customStyles: {
                        container: {
                            backgroundColor: selectedDate === dateStr ? '#F3E8FF' : 'transparent',
                        },
                        text: {
                            color: selectedDate === dateStr ? '#7E22CE' : 'white', // Text color
                        }
                    }
                };
            });
            setMarkedDates(marks);

        } catch (error) {
            console.error('Failed to fetch diary data', error);
        } finally {
            setLoading(false);
        }
    }, [user, selectedDate]);

    useEffect(() => {
        fetchMonthData(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
    }, [fetchMonthData, currentMonth]);

    const onDayPress = (day: DateData) => {
        setSelectedDate(day.dateString);
        // Find emotion for this day
        const emotion = emotions.find(e => e.createdAt.startsWith(day.dateString));
        setSelectedEmotion(emotion || null);
    };

    const handleMonthChange = (date: DateData) => {
        const newDate = new Date(date.timestamp);
        setCurrentMonth(newDate);
        // fetchMonthData is triggered by currentMonth effect
    };

    return (
        <View className="flex-1 bg-gray-900">
            <SafeAreaView edges={['top']} className="bg-gray-900 z-10">
                <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-800">
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold">Emotion Diary</Text>
                    <View style={{ width: 24 }} />
                </View>
            </SafeAreaView>

            <ScrollView className="flex-1 px-4 pt-4">
                <Calendar
                    theme={{
                        backgroundColor: '#111827',
                        calendarBackground: '#1F2937',
                        textSectionTitleColor: '#9CA3AF',
                        selectedDayBackgroundColor: '#7C3AED',
                        selectedDayTextColor: '#ffffff',
                        todayTextColor: '#A78BFA',
                        dayTextColor: '#E5E7EB',
                        textDisabledColor: '#4B5563',
                        dotColor: '#7C3AED',
                        selectedDotColor: '#ffffff',
                        arrowColor: 'white',
                        monthTextColor: 'white',
                        indicatorColor: 'white',
                        textDayFontWeight: '300',
                        textMonthFontWeight: 'bold',
                        textDayHeaderFontWeight: '300',
                        textDayFontSize: 16,
                        textMonthFontSize: 16,
                        textDayHeaderFontSize: 14
                    }}
                    onDayPress={onDayPress}
                    onMonthChange={handleMonthChange}
                    markedDates={{
                        ...markedDates,
                        [selectedDate]: {
                            ...(markedDates[selectedDate] || {}),
                            selected: true,
                            selectedColor: '#7C3AED',
                        }
                    }}
                    markingType={'simple'}
                />

                {/* Selected Date Detail */}
                <View className="mt-6 mb-10">
                    <Text className="text-gray-400 mb-2 font-semibold">
                        {selectedDate || 'Select a date'}
                    </Text>

                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : selectedEmotion ? (
                        <View className="bg-gray-800 p-6 rounded-2xl border border-gray-700 items-center">
                            <Text className="text-6xl mb-4">{EmotionIcons[selectedEmotion.emotion]}</Text>
                            <Text className="text-white text-2xl font-bold mb-1">
                                {EmotionLabels[selectedEmotion.emotion]}
                            </Text>
                            <Text className="text-gray-400 text-sm mb-4">
                                Intensity: {selectedEmotion.intensity} / 5
                            </Text>

                            {selectedEmotion.tags && (
                                <View className="flex-row flex-wrap gap-2 justify-center">
                                    {selectedEmotion.tags.split(' ').map((tag, idx) => (
                                        <Text key={idx} className="text-purple-300 bg-purple-900/50 px-3 py-1 rounded-full text-xs">
                                            {tag}
                                        </Text>
                                    ))}
                                </View>
                            )}
                        </View>
                    ) : (
                        <View className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 items-center justify-center h-48">
                            <Text className="text-gray-500">No emotion recorded for this day.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
