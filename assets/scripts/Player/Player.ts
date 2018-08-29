const { ccclass, property } = cc._decorator;

@ccclass
export default class Player extends cc.Component {

  @property(cc.Sprite)
  spriteStop: cc.Sprite = null;

  @property(cc.Sprite)
  spriteMoveLeft: cc.Sprite = null;

  @property(cc.Sprite)
  spriteMoveRight: cc.Sprite = null;

  @property(cc.Sprite)
  spriteExplode: cc.Sprite = null; // 爆発アニメーション

  @property(cc.Prefab)
  beamPrefab: cc.Prefab = null;  // ビーム

  // [TODO] Enum 型を使う
  stateLiveList: string[] = ['ALIVE', 'EXPLODING', 'EXPLODED', 'REVIVING', 'DEAD'];
  stateMoveList: string[] = ['STOP', 'MOVE_LEFT', 'MOVE_RIGHT'];

  liveState: string = 'ALIVE';   // 生存ステータス
  moveState: string = 'STOP';    // 動作ステータス

  // 機体のライフ(ビーム1発で爆発するが復活でき、その回数)
  private _life: number = 3;

  moveDx: number = 20;           // 移動速度
  shootingSpan: number = 0;      // 発射後の経過(intervalに達すると発射され、その後0にリセットされる))
  shootingInterval: number = 1;  // 発射間隔
  revivingSpan: number = 0;      // 復活アニメーションの経過時間
  maxRevivingSpan: number = 300; // 復活アニメーションの所要時間
  
  beams: cc.Node[] = [];
  spriteEmpty: cc.Sprite = new cc.Sprite;  // 透明表示用の空sprite

  /**
   * プレイヤーの残機
   */
  get life(): number {
    return this._life;
  }

  /**
   * プレイヤーを移動させる
   * @param moveLeft 左への移動可否(否なら右へ移動))
   */
  movePlayer(moveLeft: boolean): void {
    this.moveState = moveLeft ? 'MOVE_LEFT' : 'MOVE_RIGHT';
    const halfWidthOfParent = this.node.parent.width / 2;
    const halfWidthMyself = this.node.width / 2;
    const newX = Math.max(-(halfWidthOfParent) + halfWidthMyself, // 左端
                    Math.min(halfWidthOfParent - halfWidthMyself,  // 右端
                      this.node.position.x - (moveLeft ? this.moveDx : -(this.moveDx))));  // 移動予定場所
    this.node.setPositionX(newX);
  }

  /**
   * プレイヤーを停止させる
   */
  stopPlayer(): void {
    this.moveState = 'STOP';
  }

  /**
   * プレイヤーの画像をステータスに応じて再設定する
   */
  resetSpriteFrameBymoveState(): void {
    const moveSpritesMap: {[key: string]: cc.Sprite} = {
      STOP:       this.spriteStop,
      MOVE_LEFT:  this.spriteMoveLeft,
      MOVE_RIGHT: this.spriteMoveRight
    };

    if (this.liveState === 'ALIVE') {
      const sprite = this.node.getComponent(cc.Sprite);
      sprite.spriteFrame = moveSpritesMap[this.moveState].spriteFrame;
    } else if (this.liveState === 'EXPLODING') {
      const sprite = this.node.getComponent(cc.Sprite);
      sprite.spriteFrame = this.spriteExplode.spriteFrame;
    } else if (this.liveState === 'REVIVING') {
      /* 復活所要時間中は点滅させる */
      if (this.revivingSpan % 30 <= 5) {
        const sprite = this.node.getComponent(cc.Sprite);
        sprite.spriteFrame = this.spriteEmpty.spriteFrame;
      } else {
        const sprite = this.node.getComponent(cc.Sprite);
        sprite.spriteFrame = moveSpritesMap[this.moveState].spriteFrame;
      }
    }
  }

  processExploding() {
    const explodeAnimeState = this.spriteExplode.getComponent(cc.Animation).getAnimationState("explode");
    if (!explodeAnimeState.isPlaying || explodeAnimeState.isPaused) {
      explodeAnimeState.play();
    } else if (explodeAnimeState.time > 0.20) {
      explodeAnimeState.stop();
      this.liveState = 'EXPLODED';
    }
  }

  processExploded() {
    this._life--;
    if (this._life > 0) {
      this.liveState = 'REVIVING';
      return;
    }
    this.liveState = 'DEAD';
  }

  processReviving() {
    this.revivingSpan++;

    /* 復活所要時間が経過したらステータスを ALIVE にして画像を再設定する */
    if (this.revivingSpan >= this.maxRevivingSpan) {
      this.revivingSpan = 0;
      this.liveState = 'ALIVE';
      return;
    }
  }

  /**
   * ビームを発射する
   */
  shoot(): void {
    const beam = cc.instantiate(this.beamPrefab);

    beam.setPosition(this.node.position.x, this.node.position.y + this.node.height / 2);
    let dx: number = 0, dy: number = 10;
    switch (this.moveState) {
      case 'STOP':
        dx = 0;
        break;
      case 'MOVE_LEFT':
        dx = 2;
        break;
      case 'MOVE_RIGHT':
        dx = -2;
        break;
    }
    const direction = beam.getChildByName('direction');
    direction.width = dx;
    direction.height = dy;

    this.node.parent.addChild(beam);
    this.beams.push(beam);
    this.shootingSpan = 0;
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
    if (this.liveState === 'ALIVE' && other.tag === 3) {  // 敵機ビームとの衝突
      this.liveState = 'EXPLODING';
    }
  }

  /* ===== LIFE-CYCLE CALLBACKS ===== */

  start() {
    // キーボード入力でプレイヤー移動とビーム発射を行う
    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, (e) => {
      switch (e.keyCode) {
        case cc.KEY.left:
          this.moveState = 'MOVE_LEFT';
          this.movePlayer(true);
          break;
        case cc.KEY.right:
          this.moveState = 'MOVE_RIGHT';
          this.movePlayer(false);
          break;
        case cc.KEY.space:
          this.shootingSpan++;
          if (this.shootingSpan >= this.shootingInterval) {
            this.shoot();
          }
          break;
      }
    }, this);
    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, (e) => {
      this.moveState = 'STOP';
    }, this);
  }

  update(dt) {
    switch (this.liveState) {
      case 'ALIVE':
        break;
      case 'REVIVING':
        this.processReviving();
        break;
      case 'EXPLODING':
        this.processExploding();
        break;
      case 'EXPLODED':
        this.processExploded();
        break;
    }
    this.resetSpriteFrameBymoveState();
  }
}
