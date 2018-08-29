import Beam from "../Beams/Beam";

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

  moveDx: number = 10;           // 移動速度
  shootingSpan: number = 0;      // 発射後の経過(intervalに達すると発射され、その後0にリセットされる))
  shootingInterval: number = 10; // 発射間隔
  // ビームの移動ベクトル
  beamVectors = [
    { state: 'STOP',       dx: 0,  dy: 10 },
    { state: 'MOVE_LEFT',  dx: 2,  dy: 10 },
    { state: 'MOVE_RIGHT', dx: -2, dy: 10 },
  ];
  revivingSpan: number = 0;      // 復活アニメーションの経過時間
  maxRevivingSpan: number = 300; // 復活アニメーションの所要時間
  
  spriteEmpty: cc.Sprite = new cc.Sprite;  // 透明表示用の空sprite

  // 入力中のキーマップ(同時押しが有りうるので複数の値が true になりうる)
  private pressKeys : Map<number,boolean> = new Map();

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
    const beamNode = cc.instantiate(this.beamPrefab);
    const beam = beamNode.getComponent(Beam);

    beamNode.setPosition(this.node.position.x, this.node.position.y + this.node.height / 2);
    const vec = this.beamVectors.find(v => v.state === this.moveState);
    beam.dx = vec.dx;
    beam.dy = vec.dy;
    this.node.parent.addChild(beamNode);

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
    if (this.liveState === 'ALIVE') {
      if (other.tag === 3 || other.tag === 1) {
        // 敵機ビーム又は敵機との衝突で爆発する
        this.liveState = 'EXPLODING';
      }
    }
  }

  /* ===== LIFE-CYCLE CALLBACKS ===== */

  onLoad() {
    // キーボード入力でプレイヤー移動とビーム発射を行う
    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, (e) => {
      this.pressKeys.set(e.keyCode, true);

      /* キーの入力に応じて移動方向を決定して移動用ステータスを変更する */
      if (this.moveState === 'STOP') {
        /* 停止状態から走り始めたらキーの方向に移動するステータスに遷移する */
        switch (e.keyCode) {
          case cc.KEY.left:
            this.moveState = 'MOVE_LEFT';
            break;
          case cc.KEY.right:
            this.moveState = 'MOVE_RIGHT';
            break;
        }
      } else if (this.moveState === 'MOVE_LEFT' && e.keyCode === cc.KEY.right) {
        /* 左へ移動中に右が押されたら右へ移動する */
        this.moveState = 'MOVE_RIGHT';
      } else if (this.moveState === 'MOVE_RIGHT' && e.keyCode === cc.KEY.left) {
        /* 右へ移動中に左が押されたら左へ移動する */
        this.moveState = 'MOVE_LEFT';
      }
    }, this);
    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, (e) => {
      this.pressKeys.delete(e.keyCode);
      if (!this.pressKeys.has(cc.KEY.left) && !this.pressKeys.has(cc.KEY.right)) {
        this.moveState = 'STOP';
      }
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

    /* 移動用ステータスに応じて移動する */
    if (this.moveState === 'MOVE_LEFT' && this.pressKeys.has(cc.KEY.left)) {
      this.movePlayer(true);
    } else if (this.moveState === 'MOVE_RIGHT' && this.pressKeys.has(cc.KEY.right)) {
      this.movePlayer(false);
    }
    this.resetSpriteFrameBymoveState();

    /* スペースキーが押されたら攻撃する */
    if (this.pressKeys.has(cc.KEY.space)) {
      this.shootingSpan++;
      if (this.shootingSpan >= this.shootingInterval) {
        this.shoot();
      }
    }
  }
}
