import FormationBase from "../Formations/FormationBase";
import GameObjectBase from "../GameObjectBase";
import FormationEventListener from "../Formations/FormationEventListener";
import Beam from "../Beams/Beam";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Enemy extends GameObjectBase implements FormationEventListener {

  // [TODO] Enum 型を使う
  stateLiveList: string[] = ['ALIVE', 'EXPLODING', 'DEAD'];
  stateMoveList: string[] = ['STOP', 'FALL'];

  stateLive: string = 'ALIVE';         // 生存ステータス
  stateMove: string = 'FALL';          // 動作ステータス

  private life: number = 1;            // 機体のライフ(デフォルト値は1だがフォーメーションを組むと増える)
  private defencePower: number = 1;    // 防御力(damage = 1 / defencePower)
  private maxDefencePower: number = 10;// 最大防御力
  private minDefencePower: number = 1; // 最小防御力

  @property(cc.Sprite)
  spriteStop: cc.Sprite = null;        // 停止

  @property(cc.Sprite)
  spriteExplode: cc.Sprite = null;  // 爆発アニメーション

  @property(cc.Sprite)
  spriteFall: cc.Sprite = null;     // 落下アニメーション

  @property
  maxFallStep: number = 0;          // 落下アニメーションの最大ステップ数

  @property(cc.Prefab)
  beamPrefab: cc.Prefab = null;     // ビーム

  shootingSpan: number = 0;         // 発射後の経過(intervalに達すると発射され、その後0にリセットされる))
  shootingInterval: number = 60;    // 発射間隔
  shootingDirections: cc.Size[] = [ // 発射する数と方向
    new cc.Size(0, -3),             // 真下
  ];

  formations: FormationBase[] = [];

  /**
   * 死亡しているか
   */
  isDead(): boolean {
    return this.stateLive === 'DEAD';
  }

  /**
   * 停止しているか
   */
  isStopped(): boolean {
    return this.stateMove === 'STOP';
  }

  /**
   * フォーメーションを組んでいるか
   */
  beInFormation(): boolean {
    return this.formations.length > 0;
  }

  /**
   * 発射回数を1回増やして方向を決定する
   * @param direction 発射方向
   */
  addShootingDirection(direction: cc.Size) {
    const index = this.shootingDirections.findIndex(d => d.width === direction.width && d.height === direction.height);
    if (index !== -1) {
      return;
    }
    this.shootingDirections.push(direction);
  }

  /**
   * 指定した発射方向に対する発射を1回減らす
   * @param direction 発射方向
   */
  removeShootingDirection(direction: cc.Size) {
    const index = this.shootingDirections.findIndex(d => d.width === direction.width && d.height === direction.height);
    if (index === -1) {
      return;
    }
    this.shootingDirections.splice(index, 1);
  }

  /**
   * 防御力を強化する
   * @param diffPower 強化させる防御力
   */
  strengthen(diffPower: number) {
    this.defencePower = Math.max(this.minDefencePower,
                          Math.min(this.defencePower + diffPower,
                            this.maxDefencePower));
  }

  /**
   * 防御力を下げる
   * @param diffPower 下げる防御力
   */
  weaken(diffPower: number) {
    this.defencePower = Math.max(this.minDefencePower,
                          Math.min(this.defencePower - diffPower,
                            this.maxDefencePower));
  }

  /**
   * フォーメーションメンバーに参加する際に呼び出されるイベントを処理する
   */
  processJoinFormationMemberEvent(formation: FormationBase): void {
    this.formations.push(formation);
    this.stateMove = 'STOP';
  }

  /**
   * フォーメーションメンバーから離脱する際に呼び出されるイベントを処理する
   */
  processLeaveFormationMemberEvent(formation: FormationBase): void {
    const index = this.formations.indexOf(formation);
    if (index === -1) {
      console.log('Unknown formation: ' + formation.name);
      return;
    }
    this.formations.splice(index, 1);

    if (this.formations.length === 0) {
      this.stateMove = 'FALL';
    }
  }

  processAlive() {
    switch (this.stateMove) {
      case 'FALL':
        /* 下に敵が止まっていたら落下処理は行わずに終了 */
        const enemyBottom = this._board.enemyAt(this.x, this.y - this.height);
        if (enemyBottom !== null) {
          return;
        }

        /* 落下処理を行う */
        const fallAnimeState = this.spriteFall.getComponent(cc.Animation).getAnimationState("fall");
        if (!fallAnimeState.isPlaying || fallAnimeState.isPaused) {
          fallAnimeState.play();
        }
        this.node.setPositionY(this.node.position.y
          - (this.node.height / this.maxFallStep));
        return;
      case 'STOP':
        this.shootingSpan++;
        if (this.shootingSpan >= this.shootingInterval) {
          this.shoot();
        }
        return;
    }
  }

  processExplode() {
    const explodeAnimeState = this.spriteExplode.getComponent(cc.Animation).getAnimationState("explode");
    if (!explodeAnimeState.isPlaying || explodeAnimeState.isPaused) {
      explodeAnimeState.play();
    } else if (explodeAnimeState.time > 0.20) {
      this.stateLive = 'DEAD';
    }
  }

  processDead() {
    const formationsCopied = this.formations.slice(0, this.formations.length);
    formationsCopied.forEach(f => f.deconstructFormation());
    this.formations = [];
    this.node.parent.removeChild(this.node);
    this._board.destroyEnemy(this);
  }

  shoot(): void {
    this.shootingDirections.forEach(d => {
      const beamNode = cc.instantiate(this.beamPrefab);
      beamNode.setPosition(this.node.position.x, this.node.position.y - this.node.height / 2);
      const beam = beamNode.getComponent(Beam);
      beam.dx = d.width;
      beam.dy = d.height;
      this.node.parent.addChild(beamNode);
    });
    this.shootingSpan = 0;
  }

  /**
   * 敵機の画像をステータスに応じて再設定する
   */
  resetSpriteFrameByMoveState(): void {
    const sprite = this.node.getComponent(cc.Sprite);
    if (this.stateLive === 'ALIVE') {
      switch(this.stateMove) {
        case 'STOP':
          sprite.spriteFrame = this.spriteStop.spriteFrame;
          return;
        case 'FALL':
          sprite.spriteFrame = this.spriteFall.spriteFrame;
          return;
      }
    } else {
      switch(this.stateLive) {
        case 'EXPLODING':
          sprite.spriteFrame = this.spriteExplode.spriteFrame;
          return;
        case 'DEAD':
          return;
      }
    }
  }

  onEnable() {
    // 衝突判定を有効にする
    cc.director.getCollisionManager().enabled = true;
  }

  /**
   * ノード同士の処理処理
   * @param other 衝突相手
   * @param self 自分
   */
  onCollisionEnter(other, self) {
    if (this.stateLive === 'ALIVE') {
      if (other.tag === 2) {
        // プレイヤービームと衝突したらビームを相殺する
        other.node.parent.removeChild(other.node);
      }
      if (other.tag === 0 || other.tag === 2) {
        // プレイヤー機又はプレイヤービームとの衝突でダメージを受ける
        this.life -= 1 / this.defencePower;
        if (this.life <= 0) {
          this.stateLive = 'EXPLODING';
        }
      }
    }
  }

  update(dt) {
    switch (this.stateLive) {
      case 'ALIVE':
        this.processAlive();
        break;
      case 'EXPLODING':
        this.processExplode();
        break;
      case 'DEAD':
        this.processDead();
        break;
      default:
        console.log('invalid state: ' + this.stateLive);
        return;
    }
    this.resetSpriteFrameByMoveState();
  }
}
