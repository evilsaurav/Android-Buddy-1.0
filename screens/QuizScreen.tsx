import React from 'react';
import { useRoute } from '@react-navigation/native';
import ExamSessionScreen from './ExamSessionScreen';

interface Props {
  navigation: any;
}

export default function QuizScreen({ navigation }: Props) {
  const route = useRoute() as { params?: Record<string, unknown> };
  const params = { ...(route?.params || {}), mode: 'quiz' };
  return <ExamSessionScreen navigation={navigation} route={{ ...route, params }} />;
}
