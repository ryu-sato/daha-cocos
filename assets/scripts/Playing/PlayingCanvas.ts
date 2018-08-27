import Player from "../Player/Player";
import Enemy from "../Enemies/Enemy";
import GameObjectBase from "../GameObjectBase";
import FormationBase from "../Formations/FormationBase";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PlayingCanvas extends cc.Component {

  @property(cc.Prefab)
  enemyPrefab: cc.Prefab = null;  // 敵機

  @property(cc.Prefab)
  playerPrefab: cc.Prefab = null; // 自機

  @property([cc.Prefab])
  formationPrefabArray: cc.Prefab[] = [];

  player: Player = null;          // プレイヤー機
  enemies: Enemy[] = [];          // 敵機
  formations: FormationBase[] = [];   // フォーメーション

  /* マス目盤の座標を設定する */
  setSquarePosition(target: GameObjectBase, xSquarePosition: number, ySquarePosition: number): void {
    target.node.setPosition(
      -(this.node.width / 2) + (target.node.width / 2) + target.node.width * xSquarePosition,
      (this.node.height / 2) - (target.node.height / 2) - target.node.height * ySquarePosition,
    );
  }

  /* 敵が指定した座標にいるか */
  existEnemyAt(x: number, y: number): boolean {
    const enemy = this.enemyAt(x, y);
    return enemy !== null && !enemy.isDead();
  }

  /* 指定した座標にいる敵を返す */
  enemyAt(x: number, y: number): Enemy {
    const enemies = this.enemies.filter(e => e.node.position.x === x && e.node.position.y === y);
    if (enemies.length > 1) {
      console.log('Position conflict: ' + JSON.stringify(enemies));
      return null;
    }
    if (enemies.length === 0) {
      return null;
    }
    return enemies[0];
  }

  /**
   * 指定した座標の点がゲーム盤内に収まっているか
   * @param x X座標
   * @param y y座標
   */
  include(x: number, y: number): boolean {
    return x >= -(this.node.width / 2) && y >= -(this.node.height / 2)
           && x <= (this.node.width / 2) && y <= (this.node.height / 2);
  }

  start() {
    // 自機を初期化する
    const playerNode = cc.instantiate(this.playerPrefab);
    const player = playerNode.getComponent(Player);
    this.player = player;
    this.node.addChild(playerNode);

    // 敵機を初期化する
    for (let x: number = 0; x < 4; x++) {
      const enemyNode = cc.instantiate(this.enemyPrefab);
      const enemy = enemyNode.getComponent(Enemy);
      this.setSquarePosition(enemy, x, 0);
      this.enemies.push(enemy);
      this.node.addChild(enemyNode);
    }
    
    // フォーメーションを初期化する
    this.formationPrefabArray.forEach(fp => {
      fp.data.getComponent(FormationBase).setBoard(this)
    });
  }

  update() {
    /* フォーメーションを組むことが出来るか確認して、出来るようなら組む */
    this.formationPrefabArray.forEach(fp => {
      const f = fp.data.getComponent(FormationBase);
      this.enemies.forEach(e => {
        if (f.canBeInFormationWith(e)
            && this.formations.findIndex(f => f.node.name === fp.name && f.leader == e) === -1) {
          console.log('Found formation: ' + f.name);

          const formationNode = cc.instantiate(fp);
          const formation = formationNode.getComponent(FormationBase);
          formation.setBoard(this);
          formation.constructFormation(e);
          this.formations.push(formation);
        }
      });
    });

    if (this.enemies.filter(e => !e.isDead()).length === 0) {
      cc.director.loadScene('GameTitle'); // [TODO] Error 対応) loadScene: Failed to load scene 'GameTitle' because 'GameTitle' is already loading
    }
    if (this.player.liveState === 'DEAD') {
      cc.director.loadScene('GameTitle');
    }
  }
}
