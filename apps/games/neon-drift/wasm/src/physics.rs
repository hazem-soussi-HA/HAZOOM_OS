use crate::track::TrackCurve;
use crate::InputState;

pub struct CarState {
    pub x: f64,
    pub y: f64,
    pub z: f64,
    pub angle: f64,
    pub speed: f64,
    pub max_speed: f64,
    pub boost_speed: f64,
    pub drift_speed: f64,
    pub accel: f64,
    pub brake_force: f64,
    pub turn_speed: f64,
    pub nitro: f64,
    pub max_nitro: f64,
    pub nitro_drain: f64,
    pub nitro_recover: f64,
    pub invincible: f64,
    pub collision_cooldown: f64,
    pub drifting: bool,
    pub drift_angle: f64,
    pub lateral_offset: f64,
    pub progress: f64,
    pub lap: u32,
    pub lap_triggered: bool,
    pub lap_completed: bool,
}

impl CarState {
    pub fn new_player() -> CarState {
        CarState {
            x: 0.0, y: 0.0, z: 0.0, angle: 0.0, speed: 0.0,
            max_speed: 0.0008,
            boost_speed: 0.0015,
            drift_speed: 0.0012,
            accel: 0.00004,
            brake_force: 0.00008,
            turn_speed: 0.02,
            nitro: 100.0,
            max_nitro: 100.0,
            nitro_drain: 1.2,
            nitro_recover: 0.3,
            invincible: 0.0,
            collision_cooldown: 0.0,
            drifting: false,
            drift_angle: 0.0,
            lateral_offset: 0.0,
            progress: 0.0,
            lap: 1,
            lap_triggered: false,
            lap_completed: false,
        }
    }

    pub fn new_ai(base_speed: f64) -> CarState {
        let mut car = CarState::new_player();
        car.max_speed = base_speed;
        car.boost_speed = base_speed * 1.5;
        car.drift_speed = base_speed * 1.2;
        car.accel = 0.00003;
        car
    }

    pub fn update(&mut self, input: &InputState, track: &TrackCurve, dt: f64) {
        self.drifting = input.drifting && self.speed > 0.0004;

        let current_max = if input.boosting && self.nitro > 0.0 {
            self.boost_speed
        } else if self.drifting {
            self.drift_speed
        } else {
            self.max_speed
        };

        if input.accelerating && !input.braking {
            self.speed += self.accel * dt;
        } else if input.braking {
            self.speed -= self.brake_force * dt;
        } else {
            self.speed *= 0.993_f64.powf(dt);
        }
        self.speed = self.speed.max(0.0).min(current_max);

        if input.boosting && self.nitro > 0.0 {
            self.nitro -= self.nitro_drain * dt;
            self.nitro = self.nitro.max(0.0);
        } else {
            self.nitro += self.nitro_recover * dt;
            self.nitro = self.nitro.min(self.max_nitro);
        }

        let steer_amount = 0.08 * dt;
        if input.left {
            self.lateral_offset -= steer_amount;
        }
        if input.right {
            self.lateral_offset += steer_amount;
        }
        self.lateral_offset = self.lateral_offset
            .max(-16.8)
            .min(16.8);

        if self.drifting {
            if input.left {
                self.drift_angle -= 0.01 * dt;
            }
            if input.right {
                self.drift_angle += 0.01 * dt;
            }
            self.drift_angle *= 0.95_f64.powf(dt);
        } else {
            self.drift_angle *= 0.9_f64.powf(dt);
        }

        self.progress += self.speed * dt;
        if self.progress > 1.0 {
            self.progress -= 1.0;
        }
        if self.progress < 0.0 {
            self.progress += 1.0;
        }

        let pos = track.get_point_at(self.progress);
        let tan = track.get_tangent_at(self.progress);

        let nx = -tan[2];
        let nz = tan[0];
        let len = (nx * nx + nz * nz).sqrt();
        let nx = if len > 0.0 { nx / len } else { 0.0 };
        let nz = if len > 0.0 { nz / len } else { 1.0 };

        self.x = pos[0] + nx * self.lateral_offset;
        self.y = pos[1] + 2.0;
        self.z = pos[2] + nz * self.lateral_offset;
        self.angle = tan[2].atan2(tan[0]);

        if self.invincible > 0.0 {
            self.invincible -= dt / 60.0;
        }
        if self.collision_cooldown > 0.0 {
            self.collision_cooldown -= dt / 60.0;
        }

        self.lap_completed = false;
    }

    pub fn check_lap(&mut self) -> bool {
        if self.progress > 0.95 && !self.lap_triggered {
            self.lap_triggered = true;
        }
        if self.lap_triggered && self.progress < 0.05 && self.progress > 0.0 {
            self.lap += 1;
            self.lap_triggered = false;
            self.lap_completed = true;
            return true;
        }
        if self.progress > 0.4 && self.progress < 0.6 {
            self.lap_triggered = false;
        }
        false
    }

    pub fn ai_update(&mut self, _target_progress: f64, track: &TrackCurve, dt: f64) {
        self.progress += self.max_speed * dt;
        if self.progress > 1.0 {
            self.progress -= 1.0;
            self.lap += 1;
        }
        if self.progress < 0.0 {
            self.progress += 1.0;
        }

        let pos = track.get_point_at(self.progress);
        let tan = track.get_tangent_at(self.progress);

        self.x = pos[0];
        self.y = pos[1] + 2.0;
        self.z = pos[2];
        self.angle = tan[2].atan2(tan[0]);
    }
}
