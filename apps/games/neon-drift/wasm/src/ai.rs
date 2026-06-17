use crate::physics::CarState;
use crate::track::TrackCurve;
use crate::InputState;

pub struct AIDriver {
    pub car: CarState,
    pub color: u32,
    pub base_speed: f64,
    pub racing_line: f64,
    pub target_racing_line: f64,
    pub speed_variance: f64,
    pub speed_change_timer: f64,
}

impl AIDriver {
    pub fn create_four() -> Vec<AIDriver> {
        let configs = [
            (0xff0000u32, 0.00065, "BLADE"),
            (0xffff00u32, 0.00060, "VIPER"),
            (0x00ff00u32, 0.00055, "NOVA"),
            (0xff8800u32, 0.00050, "SHADOW"),
        ];

        configs.iter().enumerate().map(|(i, &(color, speed, _))| {
            let mut car = CarState::new_ai(speed);
            car.progress = (i as f64 + 1.0) / 10.0;
            AIDriver {
                car,
                color,
                base_speed: speed,
                racing_line: 0.0,
                target_racing_line: 0.0,
                speed_variance: 0.0,
                speed_change_timer: 0.0,
            }
        }).collect()
    }

    pub fn update(&mut self, track: &TrackCurve, dt: f64) {
        self.speed_change_timer += dt;
        if self.speed_change_timer > 120.0 {
            self.speed_change_timer = 0.0;
            self.speed_variance = (rand_f64() - 0.5) * 0.0001;
        }

        let effective_speed = self.base_speed + self.speed_variance;

        self.car.progress += effective_speed * dt;
        if self.car.progress > 1.0 {
            self.car.progress -= 1.0;
            self.car.lap += 1;
        }
        if self.car.progress < 0.0 {
            self.car.progress += 1.0;
        }

        self.racing_line += (self.target_racing_line - self.racing_line) * 0.05 * dt;
        if rand_f64() < 0.02 * dt {
            self.target_racing_line = (rand_f64() - 0.5) * 2.0;
        }

        let pos = track.get_point_at(self.car.progress);
        let tan = track.get_tangent_at(self.car.progress);

        let nx = -tan[2];
        let nz = tan[0];
        let len = (nx * nx + nz * nz).sqrt();
        let nx = if len > 0.0 { nx / len } else { 0.0 };
        let nz = if len > 0.0 { nz / len } else { 1.0 };

        let offset = self.racing_line * 8.0;
        self.car.x = pos[0] + nx * offset;
        self.car.y = pos[1] + 2.0;
        self.car.z = pos[2] + nz * offset;
        self.car.angle = tan[2].atan2(tan[0]);
    }

    pub fn drive_ai(player: &CarState, track: &TrackCurve, _dt: f64) -> InputState {
        let look_ahead = 0.02;
        let target_t = (player.progress + look_ahead) % 1.0;
        let target = track.get_point_at(target_t);

        let target_angle = (target[2] - player.z).atan2(target[0] - player.x);
        let mut diff = target_angle - player.angle;
        while diff > std::f64::consts::PI { diff -= 2.0 * std::f64::consts::PI; }
        while diff < -std::f64::consts::PI { diff += 2.0 * std::f64::consts::PI; }

        let left = diff < -0.08;
        let right = diff > 0.08;
        let drifting = diff.abs() > 0.6 && player.speed > 0.0004;

        let speed_target = if diff.abs() < 0.3 {
            player.max_speed
        } else if diff.abs() < 0.8 {
            player.drift_speed
        } else {
            player.max_speed * 0.5
        };

        let accelerating = player.speed < speed_target;
        let braking = player.speed > speed_target + 0.0001;
        let boosting = diff.abs() < 0.2 && player.nitro > 30.0 && player.speed > player.max_speed * 0.7;

        InputState::new(accelerating, braking, boosting, left, right, drifting)
    }
}

fn rand_f64() -> f64 {
    use std::sync::atomic::{AtomicU64, Ordering};
    static SEED: AtomicU64 = AtomicU64::new(42);
    let s = SEED.fetch_add(1, Ordering::Relaxed);
    let x = s.wrapping_mul(6364136223846793005).wrapping_add(1);
    ((x >> 33) as f64) / (u32::MAX as f64)
}
