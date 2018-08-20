import * as Enemy from '../Enemies/Enemy';

const { ccclass, property } = cc._decorator;

@ccclass
export default class PlayingCanvas extends cc.Component {

  @property(cc.Prefab)
  enemy_prefab: cc.Prefab = null; // 敵機

  enemies: cc.Node[] = [];

  start() {
    // 敵機を初期化する
    for (let x: number = 0; x < 10; x++) {
      const enemy = cc.instantiate(this.enemy_prefab);
      enemy.setPosition(
        -(this.node.width / 2) + (enemy.width / 2) + enemy.width * x,
        (this.node.height / 2) - (enemy.height / 2)
      );
      this.node.addChild(enemy);
      this.enemies.push(enemy);
    }
  }

  update() {
    if (this.node.childrenCount === 1) {  // [TODO] 残り子数ではなく enemies = 0 で判別する
      cc.director.loadScene('GameTitle');
    }
  }
}
