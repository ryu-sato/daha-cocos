import * as Enemy from '../Enemies/Enemy';

const { ccclass, property } = cc._decorator;

@ccclass
export default class PlayingCanvas extends cc.Component {

  @property(cc.Prefab)
  enemy_prefab: cc.Prefab = null; // 敵機

  start() {
    for (let x: number = 0; x < 10; x++) {
      const enemy_prefab = cc.instantiate(this.enemy_prefab);
      enemy_prefab.setPosition(x * 30, 300);
      this.node.addChild(enemy_prefab);
    }
  }

  update() {
    // this.enemies.forEach(enemy => {});
  }
}
