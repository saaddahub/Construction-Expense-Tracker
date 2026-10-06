import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Text from './Text';
import { colors } from '../theme/colors';
import { formatPKR } from '../utils/helpers';

function CategoryChart({ data, total, label }) {
  const circumference = 2 * Math.PI * 72;
  const sum = data.reduce((value, item) => value + item.value, 0) || 1;
  let offset = 0;
  return (
    <View style={styles.chart} accessible accessibilityLabel={`${label}: ${formatPKR(total)}`}>
      <Svg width={180} height={180} viewBox="0 0 180 180">
        <Circle cx={90} cy={90} r={72} fill="none" stroke={colors.border} strokeWidth={16} />
        {data.map((item, index) => {
          const length = (item.value / sum) * circumference;
          const start = offset;
          offset += length;
          return <Circle key={index} cx={90} cy={90} r={72} fill="none" stroke={item.color} strokeWidth={16}
            strokeDasharray={`${length} ${circumference}`} strokeDashoffset={-start} transform="rotate(-90 90 90)" />;
        })}
      </Svg>
      <View style={styles.center}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.total}>{formatPKR(total)}</Text>
      </View>
    </View>
  );
}
export default memo(CategoryChart);
const styles = StyleSheet.create({
  chart: { width: 180, height: 180 },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' },
  label: { fontSize: 12, color: colors.textMuted },
  total: { fontSize: 20, fontWeight: '600', color: colors.textPrimary, marginTop: 4 },
});
