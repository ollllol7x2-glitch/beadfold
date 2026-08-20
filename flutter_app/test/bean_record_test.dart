import 'package:beanfold_flutter/main.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('reads a bean row returned by Supabase', () {
    final bean = BeanRecord.fromJson({
      'id': 'bean_1',
      'name': '과테말라 안티구아',
      'remaining_weight_g': 170,
    });

    expect(bean.id, 'bean_1');
    expect(bean.name, '과테말라 안티구아');
    expect(bean.remainingWeightG, 170);
  });
}
