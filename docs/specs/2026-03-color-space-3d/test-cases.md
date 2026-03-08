# Test Cases: Color Space 3D Visualization

## 対応要求

- FR-1
- FR-2
- FR-3
- FR-4

## 正常系

- TC-001: RGB / HSL / Lab タブを切り替えると、それぞれの3D表示が描画される（FR-1）
- TC-002: RGB / HSL / Lab の各表示でドラッグ回転できる（FR-2）
- TC-003: 各表示でホバー色が Inspector に反映される（FR-3）
- TC-004: 各表示でクリック選択色が Inspector / Color Copy に反映される（FR-3）
- TC-005: RGB表示で Slice の軸/値変更が3D表示に反映される（FR-4）

## 異常系

- TC-101: 点群から離れた位置をホバーしたとき、Inspector のホバー表示が解除される（FR-3）
- TC-102: タブを連続切替しても描画が停止しない（FR-1, FR-2）
