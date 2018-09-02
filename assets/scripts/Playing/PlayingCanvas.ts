import Player from "../Player/Player";
import Enemy from "../Enemies/Enemy";
import GameObjectBase from "../GameObjectBase";
import FormationBase from "../Formations/FormationBase";

const { ccclass, property } = cc._decorator;

/**
 * ゲーム盤上のxy座標
 */
class SquarePosition {
  x: number = 0;
  y: number = 0;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

@ccclass
export default class PlayingCanvas extends cc.Component {

  // インスタンス
  private static _instance: PlayingCanvas = null;

  // 敵機
  @property(cc.Prefab)
  enemyPrefab: cc.Prefab = null;

  // 自機
  @property(cc.Prefab)
  playerPrefab: cc.Prefab = null;

  // フォーメーション用prefab
  @property([cc.Prefab])
  formationPrefabArray: cc.Prefab[] = [];

  // 敵機を破壊した時の点数
  @property
  scoreByDestroyingAnEnemy: number = null;

  player: Player = null;             // プレイヤー機
  enemies: Enemy[] = [];             // 敵機
  formations: FormationBase[] = [];  // フォーメーション

  // 表示用難易度テキスト(デバッグ用)
  difficultyText: cc.RichText = null;

  // 表示用スコアテキスト
  scoreText: cc.RichText = null;
  // スコア
  score: number = 0;

  // ステージ番号
  stage: number = 1;
  // 表示用ステージテキスト
  stageText: cc.RichText = null;

  // プレイヤー残数
  lifeText: cc.RichText = null;

  // ゲームステータス
  // [TODO] ENUMにする
  gameStatus: string = 'LOADING_STAGE';

  // 敵配置領域
  private areaContainEnemy: cc.Size = null;
  private maxXSquare = 10;
  private maxYSquare = 4;

  /**
   * インスタンスを取得する
   */
  static get instance(): PlayingCanvas {
    return PlayingCanvas._instance;
  }

  /**
   * コンストラクタ
   */
  constructor() {
    super();

    /* static にアクセスできるようインスタンスを保存する */
    PlayingCanvas._instance = this;
  }

  /* マス目盤の座標を設定する */
  setSquarePosition(target: GameObjectBase, xSquarePosition: number, ySquarePosition: number): void {
    target.node.setPosition(
      -(this.areaContainEnemy.width / 2) + (target.node.width / 2) + target.node.width * xSquarePosition,
      (this.areaContainEnemy.height / 2) - (target.node.height / 2) - target.node.height * ySquarePosition,
    );
  }

  /* 敵が指定した座標にいるか */
  existEnemyAt(x: number, y: number): boolean {
    const enemy = this.enemyAt(x, y);
    return enemy !== null && !enemy.isDead();
  }

  /* 指定した座標にいる敵を返す */
  // [TODO] マス目で扱う
  enemyAt(x: number, y: number): Enemy {
    const enemies = this.enemies.filter(e => e.x === x && e.y == y);
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
   * 指定したオブジェクトが完全にゲーム盤内に収まっているか
   * @param gameObject 対象のゲームオブジェクト
   */
  include(gameObject: GameObjectBase): boolean {
    return -(this.node.width / 2) <= gameObject.xLeft && gameObject.xRight <= (this.node.width / 2)
           && -(this.node.height / 2) <= gameObject.yBottom && gameObject.yTop <= (this.node.height / 2);
  }

  /**
   * 指定したオブジェクトが完全にゲーム盤外に出ているか
   * @param gameObject 対象のゲームオブジェクト
   */
  exclude(gameObject: GameObjectBase): boolean {
    return gameObject.xRight < -(this.node.width / 2) || (this.node.width / 2) < gameObject.xLeft
           || gameObject.yTop < -(this.node.height / 2) || (this.node.height / 2) < gameObject.yBottom;
  }

  /**
   * フォーメーションを破棄する
   * @param formation 対象のフォーメーション
   */
  destroyFormation(formation: FormationBase): boolean {
    const index = this.formations.indexOf(formation);
    if (index === -1) {
      return false;
    }
    this.node.removeChild(formation.node);
    this.formations.splice(index, 1);
    return true;
  }

  /**
   * 敵機を破棄する
   * @param enemy 対象の敵機
   */
  destroyEnemy(enemy: Enemy): boolean {
    const index = this.enemies.indexOf(enemy);
    if (index === -1) {
      return false;
    }
    this.node.removeChild(enemy.node);
    this.enemies.splice(index, 1);
    this.score += this.scoreByDestroyingAnEnemy;
    this.setInfoBoard();
    return true;
  }

  /**
   * スコアテキストを設定する
   */
  setInfoBoard() {
    this.scoreText.string = '<color=#ff0000>' + this.score + '</color><size=20>pt</size>';
    this.stageText.string = '<size=20>Stage:</size>' + '<color=#ffff00><size=40>' + this.stage + '</size></color>';
    this.difficultyText.string = 'Difficulty: ' + this.culculateDifficultyLevel(this.enemies);
    this.lifeText.string = 'Life: ' + this.player.life;
  }

  /**
   * ステージクリア処理を行う
   */
  private processStageClear() {
    this.stage++;
    this.gameStatus = 'LOADING_STAGE';
    this.generateStage(this.stage);
  }

  /**
   * 全ての敵機がステージ内に収まって表示されているか
   */
  private includeAllEnemies(): boolean {
    return this.enemies.filter(e => !this.include(e)).length === 0;
  }

  /**
   * 難易度を計算する
   * @param enemies 敵機
   */
  private culculateDifficultyLevel(enemies: Enemy[]): number {
    const formations: FormationBase[] = [];
    this.formationPrefabArray.forEach(fp => {
      const f = fp.data.getComponent(FormationBase);
      this.enemies.forEach(e => {
        if (f.canBeInFormationWith(e)
            && formations.findIndex(f => f.node.name === fp.name && f.leader == e) === -1) {
          const formationNode = cc.instantiate(fp);
          const formation = formationNode.getComponent(FormationBase);
          formations.push(formation);
        }
      });
    });

    if (formations.length === 0) {
      return 0;
    }
    let difficultyLevel = 0;
    const matrix = [
      { formation: 'QuicknessFormation', point: 1.2 },
      { formation: 'DefenceFormation',   point: 1.4 },
      { formation: 'BurstBeamFormation', point: 1.3 }
    ];
    matrix.forEach(m => {
      difficultyLevel += formations.filter(f => f.node.name === m.formation).length * m.point;
    });
    return difficultyLevel;
  }

  /**
   * ステージを設定する
   * @param difficultyLevel 難易度
   */
  private generateStage(difficultyLevel: number) {
    if (difficultyLevel < 1) {
      return;
    }

    let maxRetry = 30;
    let newEnemies = [];
    let difficulty = 0;
    do {
      let xyList: SquarePosition[] = [];
      for (let x = 0; x <= this.maxXSquare; x++) {
        for (let y = 0; y <= this.maxYSquare; y++) {
          xyList.push(new SquarePosition(x, y));
        }
      }
      newEnemies = [];
      const numEnemies = Math.min(difficultyLevel * 5 + Math.floor(Math.random() * 5), xyList.length);
      for (let i = 0; i < numEnemies; i++) {
        const xy: SquarePosition = xyList.splice(Math.floor(Math.random() * (xyList.length - 1)), 1)[0];
        const enemyNode = cc.instantiate(this.enemyPrefab);
        const enemy = enemyNode.getComponent(Enemy);
        this.setSquarePosition(enemy, xy.x, xy.y);
        newEnemies.push(enemy);
      }
      difficulty = this.culculateDifficultyLevel(newEnemies);
    } while(Math.abs(difficultyLevel - difficulty) < 2 && --maxRetry > 0);
    this.enemies = newEnemies;
    newEnemies.forEach(e => this.node.addChild(e.node));
  }

  start() {
    // ゲーム盤を初期化する
    this.areaContainEnemy = new cc.Size(this.node.width - 90, this.node.height - 100);
    const infoBoard = this.node.getChildByName("infoBoard");
    const scoreNode = infoBoard.getChildByName("score");
    this.scoreText = scoreNode.getComponent(cc.RichText);
    this.stageText = infoBoard.getChildByName("stage").getComponent(cc.RichText);
    this.difficultyText = infoBoard.getChildByName("difficulty").getComponent(cc.RichText);
    this.lifeText = infoBoard.getChildByName("life").getComponent(cc.RichText);

    // 自機を初期化する
    const playerNode = cc.instantiate(this.playerPrefab);
    const player = playerNode.getComponent(Player);
    this.player = player;
    this.node.addChild(playerNode);

    // 敵機を初期化する
    this.generateStage(this.stage);
  }

  update() {
    /* フォーメーションを組むことが出来るか確認して、出来るようなら組む */
    if (this.gameStatus === 'PLAYING') {
      this.formationPrefabArray.forEach(fp => {
        const f = fp.data.getComponent(FormationBase);
        this.enemies.forEach(e => {
          if (f.canBeInFormationWith(e)
              && this.formations.findIndex(f => f.node.name === fp.name && f.leader == e) === -1) {
            console.log('Found formation: ' + f.name);

            const formationNode = cc.instantiate(fp);
            formationNode.setPosition(e.node.getPosition());
            const formation = formationNode.getComponent(FormationBase);
            formation.constructFormation(e);
            this.formations.push(formation);
            this.node.addChild(formationNode);
          }
        });
      });
    }

    /* 敵を全滅したらステージクリア時の処理を行う */
    if (this.enemies.filter(e => !e.isDead()).length === 0) {
      // [TODO] Stage アップアニメーションをする
      this.processStageClear();
    }

    /* 敵が画面上に表示され終わったらステージスタート処理を行う */
    if (this.includeAllEnemies()) {
      this.gameStatus = 'PLAYING';
    }

    if (this.player.liveState === 'DEAD') {
      // [TODO] GameOver処理を行う
      // [TODO] Error 対応) loadScene: Failed to load scene 'GameTitle' because 'GameTitle' is already loading
      cc.director.loadScene('GameTitle');
    }

    this.setInfoBoard();
  }
}
