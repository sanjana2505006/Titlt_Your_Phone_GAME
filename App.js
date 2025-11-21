import { StatusBar } from "expo-status-bar";
import { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
} from "react-native";
import { Accelerometer } from "expo-sensors";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const SPACESHIP_WIDTH = 50;
const SPACESHIP_HEIGHT = 50;

const BULLET_WIDTH = 10;
const BULLET_HEIGHT = 20;

const ENEMY_WIDTH = 40;
const ENEMY_HEIGHT = 40;

export default function App() {
  const [spaceshipX, setSpaceshipX] = useState(
    (screenWidth - SPACESHIP_WIDTH) / 2
  );
  const [bullets, setBullets] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    Accelerometer.setUpdateInterval(100);

    const subscription = Accelerometer.addListener(({ x }) => {
      const move = x * 30;
      setSpaceshipX((prev) => {
        const next = prev + move;
        return Math.max(0, Math.min(screenWidth - SPACESHIP_WIDTH, next));
      });
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      setBullets((prevBullets) => {
        let updatedBullets = prevBullets
          .map((b) => ({ ...b, y: b.y - 10 }))
          .filter((b) => b.y > 0);

        setEnemies((prevEnemies) => {
          let updatedEnemies = prevEnemies
            .map((e) => {
              let newX = e.x + e.vx;
              if (newX < 0 || newX > screenWidth - ENEMY_WIDTH) {
                e.vx = -e.vx;
                newX = e.x + e.vx;
              }
              return { ...e, x: newX, y: e.y + 5 };
            })
            .filter((e) => e.y < screenHeight);

          // Check for spaceship-enemy collision
          const spaceshipHit = updatedEnemies.some(
            (enemy) =>
              spaceshipX < enemy.x + ENEMY_WIDTH &&
              spaceshipX + SPACESHIP_WIDTH > enemy.x &&
              screenHeight - SPACESHIP_HEIGHT < enemy.y + ENEMY_HEIGHT &&
              screenHeight - SPACESHIP_HEIGHT + SPACESHIP_HEIGHT > enemy.y
          );

          if (spaceshipHit) {
            setGameOver(true);
            return updatedEnemies;
          }

          // Identify hits
          const hitBullets = new Set();
          const hitEnemies = new Set();

          updatedBullets.forEach((bullet, bulletIndex) => {
            updatedEnemies.forEach((enemy, enemyIndex) => {
              if (
                bullet.x < enemy.x + ENEMY_WIDTH &&
                bullet.x + BULLET_WIDTH > enemy.x &&
                bullet.y < enemy.y + ENEMY_HEIGHT &&
                bullet.y + BULLET_HEIGHT > enemy.y
              ) {
                hitBullets.add(bulletIndex);
                hitEnemies.add(enemyIndex);
              }
            });
          });

          // Remove hit bullets and enemies, update score
          updatedBullets = updatedBullets.filter((_, i) => !hitBullets.has(i));
          const enemiesRemoved = updatedEnemies.filter(
            (_, i) => !hitEnemies.has(i)
          );
          setScore(
            (prev) => prev + (updatedEnemies.length - enemiesRemoved.length)
          );

          return enemiesRemoved;
        });

        return updatedBullets;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [gameOver, spaceshipX]);

  const handleShoot = () => {
    if (gameOver) return;
    const newBullet = {
      id: Date.now(),
      x: spaceshipX + (SPACESHIP_WIDTH - BULLET_WIDTH) / 2,
      y: screenHeight - SPACESHIP_HEIGHT - BULLET_HEIGHT,
    };
    setBullets((prev) => [...prev, newBullet]);
  };

  useEffect(() => {
    if (gameOver) return;
    const spawnInterval = setInterval(() => {
      const enemyTypes = ["alien", "asteroid", "ufo"];
      const newEnemy = {
        id: Date.now(),
        x: Math.random() * (screenWidth - ENEMY_WIDTH),
        y: -ENEMY_HEIGHT,
        vx: Math.random() * 6 - 3, // Random horizontal velocity between -3 and 3
        type: enemyTypes[Math.floor(Math.random() * enemyTypes.length)],
      };
      setEnemies((prev) => [...prev, newEnemy]);
    }, 1500);
    return () => clearInterval(spawnInterval);
  }, [gameOver]);

  const resetGame = () => {
    setSpaceshipX((screenWidth - SPACESHIP_WIDTH) / 2);
    setBullets([]);
    setEnemies([]);
    setScore(0);
    setGameOver(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.score}>Score: {score}</Text>
      <View style={[styles.spaceship, { left: spaceshipX }]} />
      {bullets.map((b) => (
        <View style={[styles.bullet, { left: b.x, top: b.y }]} key={b.id} />
      ))}
      {enemies.map((e) => (
        <Text style={[styles.enemy, { left: e.x, top: e.y }]} key={e.id}>
          {e.type === "alien" ? "👽" : e.type === "asteroid" ? "☄️" : "🛸"}
        </Text>
      ))}
      {gameOver && (
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverText}>Game Over!</Text>
          <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
            <Text style={styles.resetButtonText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity style={styles.shootButton} onPress={handleShoot}>
        <Text style={styles.shootButtonText}>Shoot</Text>
      </TouchableOpacity>
      <Text style={styles.instruction}>Tilt your phone to move spaceship</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 60,
  },
  score: {
    position: "absolute",
    top: 40,
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "Courier",
  },
  spaceship: {
    position: "absolute",
    bottom: 20,
    width: SPACESHIP_WIDTH,
    height: SPACESHIP_HEIGHT,
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: "#000",
  },
  instruction: {
    position: "absolute",
    top: 70,
    color: "#fff",
    fontFamily: "Courier",
    fontSize: 14,
  },
  bullet: {
    position: "absolute",
    width: BULLET_WIDTH,
    height: BULLET_HEIGHT,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#000",
  },
  enemy: {
    position: "absolute",
    width: ENEMY_WIDTH,
    height: ENEMY_HEIGHT,
    fontSize: 30,
  },
  gameOverContainer: {
    position: "absolute",
    top: screenHeight / 2 - 100,
    alignItems: "center",
  },
  gameOverText: {
    color: "#FFF",
    fontSize: 36,
    fontWeight: "bold",
    fontFamily: "Courier",
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  resetButtonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
  },
});
