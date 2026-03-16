import { Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { VictoryAxis, VictoryBar, VictoryChart, VictoryGroup, VictoryTheme } from 'victory-native';

export function IncomeVsExpenseBarChart(props: {
  buckets: Array<{ label: string; income: number; expense: number }>;
}) {
  if (!props.buckets.length) return null;
  if (Platform.OS === 'web') {
    return <Text style={{ opacity: 0.7, marginTop: 8 }}>Charts are available in the mobile app.</Text>;
  }

  const incomeData = props.buckets.map((b, i) => ({ x: i + 1, y: b.income, label: b.label }));
  const expenseData = props.buckets.map((b, i) => ({ x: i + 1, y: b.expense, label: b.label }));

  return (
    <VictoryChart height={260} theme={VictoryTheme.material} domainPadding={{ x: 10, y: 10 }}>
      <VictoryAxis
        tickValues={incomeData.map((d) => d.x)}
        tickFormat={incomeData.map((d) => d.label)}
        style={{ tickLabels: { fontSize: 10, padding: 6 } }}
      />
      <VictoryAxis dependentAxis style={{ tickLabels: { fontSize: 10, padding: 4 } }} />
      <VictoryGroup offset={10}>
        <VictoryBar data={incomeData} style={{ data: { fill: '#2E7D32' } }} />
        <VictoryBar data={expenseData} style={{ data: { fill: '#C62828' } }} />
      </VictoryGroup>
    </VictoryChart>
  );
}

