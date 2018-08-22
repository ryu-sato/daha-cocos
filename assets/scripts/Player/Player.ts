import PlayingCanvas from "../Playing/PlayingCanvas";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Player extends cc.Component {

  @property(cc.Sprite)
  sprite_stop: cc.Sprite = null;

  @property(cc.Sprite)
  sprite_move_left: cc.Sprite = null;

  @property(cc.Sprite)
  sprite_move_right: cc.Sprite = null;

  @property(cc.Sprite)
  sprite_explode: cc.Sprite = null; // 爆発アニメーション

  @property(cc.Prefab)
  beam_prefab: cc.Prefab = null;  // ビーム

  // [TODO] Enum 型を使う
  state_live_list: string[] = ['ALIVE', 'EXPLODING', 'EXPLODED', 'REVIVING', 'DEAD'];
  state_move_list: string[] = ['STOP', 'MOVE_LEFT', 'MOVE_RIGHT'];

  state_live: string = 'ALIVE';   // 生存ステータス
  state_move: string = 'STOP';    // 動作ステータス

  life: number = 3;               // 機体のライフ(ビーム1発で爆発するが復活でき、その回数)

  move_dx: number = 20;           // 移動速度
  shooting_span: number = 0;      // 発射後の経過(intervalに達すると発射され、その後0にリセットされる))
  shooting_interval: number = 1;  // 発射間隔
  reviving_span: number = 0;      // 復活アニメーションの経過時間
  max_reviving_span: number = 300;// 復活アニメーションの所要時間
  
  beams: cc.Node[] = [];
  sprite_empty: cc.Sprite = new cc.Sprite;  // 透明表示用の空sprite
  playingCanvas: PlayingCanvas = null;

  /**
   * プレイヤーを移動させる
   * @param moveLeft 左への移動可否(否なら右へ移動))
   */
  movePlayer(moveLeft: boolean): void {
    this.state_move = moveLeft ? 'MOVE_LEFT' : 'MOVE_RIGHT';
    const half_width_of_parent = this.node.parent.width / 2;
    const half_width_myself = this.node.width / 2;
    const new_x = Math.max(-(half_width_of_parent) + half_width_myself, // 左端
                    Math.min(half_width_of_parent - half_width_myself,  // 右端
                      this.node.position.x - (moveLeft ? this.move_dx : -(this.move_dx))));  // 移動予定場所
    this.node.setPositionX(new_x);
  }

  /**
   * プレイヤーを停止させる
   */
  stopPlayer(): void {
    this.state_move = 'STOP';
  }

  /**
   * プレイヤーの画像をステータスに応じて再設定する
   */
  resetSpriteFrameByMoveState(): void {
    const move_sprites_map: {[key: string]: cc.Sprite} = {
      STOP:       this.sprite_stop,
      MOVE_LEFT:  this.sprite_move_left,
      MOVE_RIGHT: this.sprite_move_right
    };

    if (this.state_live === 'ALIVE') {
      const sprite = this.node.getComponent(cc.Sprite);
      sprite.spriteFrame = move_sprites_map[this.state_move].spriteFrame;
    } else if (this.state_live === 'EXPLODING') {
      const sprite = this.node.getComponent(cc.Sprite);
      sprite.spriteFrame = this.sprite_explode.spriteFrame;
    } else if (this.state_live === 'REVIVING') {
      /* 復活所要時間中は点滅させる */
      if (this.reviving_span % 30 <= 5) {
        const sprite = this.node.getComponent(cc.Sprite);
        sprite.spriteFrame = this.sprite_empty.spriteFrame;
      } else {
        const sprite = this.node.getComponent(cc.Sprite);
        sprite.spriteFrame = move_sprites_map[this.state_move].spriteFrame;
      }
    }
  }

  processExploding() {
    const explode_anime_state = this.sprite_explode.getComponent(cc.Animation).getAnimationState("explode");
    if (!explode_anime_state.isPlaying || explode_anime_state.isPaused) {
      explode_anime_state.play();
    } else if (explode_anime_state.time > 0.20) {
      explode_anime_state.stop();
      this.state_live = 'EXPLODED';
    }
  }

  processExploded() {
    this.life--;
    if (this.life > 0) {
      this.state_live = 'REVIVING';
      return;
    }
    this.state_live = 'DEAD';
  }

  processReviving() {
    this.reviving_span++;

    /* 復活所要時間が経過したらステータスを ALIVE にして画像を再設定する */
    if (this.reviving_span >= this.max_reviving_span) {
      this.reviving_span = 0;
      this.state_live = 'ALIVE';
      return;
    }
  }

  /**
   * ビームを発射する
   */
  shoot(): void {
    const beam = cc.instantiate(this.beam_prefab);

    beam.setPosition(this.node.position.x, this.node.position.y + this.node.height / 2);
    let dx: number = 0, dy: number = 10;
    switch (this.state_move) {
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
    this.shooting_span = 0;
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
    if (this.state_live === 'ALIVE' && other.tag === 3) {  // 敵機ビームとの衝突
      this.state_live = 'EXPLODING';
    }
  }

  /* ===== LIFE-CYCLE CALLBACKS ===== */

  start() {
    // キーボード入力でプレイヤー移動とビーム発射を行う
    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, (e) => {
      switch (e.keyCode) {
        case cc.KEY.left:
          this.state_move = 'MOVE_LEFT';
          this.movePlayer(true);
          break;
        case cc.KEY.right:
          this.state_move = 'MOVE_RIGHT';
          this.movePlayer(false);
          break;
        case cc.KEY.space:
          this.shooting_span++;
          if (this.shooting_span >= this.shooting_interval) {
            this.shoot();
          }
          break;
      }
    }, this);
    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, (e) => {
      this.state_move = 'STOP';
    }, this);
  }

  update(dt) {
    switch (this.state_live) {
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
    this.resetSpriteFrameByMoveState();
  }
}
