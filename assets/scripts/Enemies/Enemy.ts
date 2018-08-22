const { ccclass, property } = cc._decorator;

@ccclass
export default class Enemy extends cc.Component {

  // [TODO] Enum 型を使う
  stateLiveList: string[] = ['ALIVE', 'EXPLODING', 'DEAD'];
  stateMoveList: string[] = ['STOP', 'FALL'];

  stateLive: string = 'ALIVE';     // 生存ステータス
  stateMove: string = 'STOP';      // 動作ステータス

  life: number = 1;                 // 機体のライフ(デフォルト値は1だがフォーメーションを組むと増える)

  @property(cc.Sprite)
  spriteStop: cc.Sprite = null;    // 停止

  @property(cc.Sprite)
  spriteExplode: cc.Sprite = null; // 爆発アニメーション

  @property(cc.Sprite)
  spriteFall: cc.Sprite = null;    // 落下アニメーション

  @property
  maxFallStep: number = 0;        // 落下アニメーションの最大ステップ数

  @property(cc.Prefab)
  beamPrefab: cc.Prefab = null;    // ビーム

  shootingSpan: number = 0;        // 発射後の経過(intervalに達すると発射され、その後0にリセットされる))
  shootingInterval: number = 60;   // 発射間隔

  beams: cc.Node[] = [];

  processAlive() {
    switch (this.stateMove) {
      case 'FALL':
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
    this.node.parent.removeChild(this.node);
    // this.destroy();
  }

  shoot(): void {
    const beam = cc.instantiate(this.beamPrefab);

    beam.setPosition(this.node.position.x, this.node.position.y - this.node.height / 2);
    let dx: number = 0, dy: number = -3;
    // [TODO] フォーメーションに応じて攻撃方法を変える
    const direction = beam.getChildByName('direction');
    direction.width = dx;
    direction.height = dy;

    this.node.parent.addChild(beam);
    this.beams.push(beam);
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
    if (other.tag === 2) {  // プレイヤービームとの衝突
      this.life--;
      if (this.life <= 0) {
        this.stateLive = 'EXPLODING';
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
        break;
    }
    this.resetSpriteFrameByMoveState();
  }
}
