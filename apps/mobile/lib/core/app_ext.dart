import 'package:flutter/material.dart';

extension WidgetExt on Widget {
  Widget expand() => Expanded(child: this);
  Widget get ext => this;
}
