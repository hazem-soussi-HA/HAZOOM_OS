mod physics;
mod ai;
mod track;

use wasm_bindgen::prelude::*;
use physics::CarState;
use ai::AIDriver;
use track::TrackCurve;

#[wasm_bindgen]
pub struct GameState {
    player: CarState,
    ai_drivers: Vec<AIDriver>,
    track: TrackCurve,
    game_time: f64,
    lap: u32,
    lap_start_time: f64,
    top_speed: f64,
    lap_times: Vec<f64>,
    best_lap: f64,
    race_finished: bool,
}

#[wasm_bindgen]
impl GameState {
    #[wasm_bindgen(constructor)]
    pub fn new() -> GameState {
        GameState {
            player: CarState::new_player(),
            ai_drivers: Vec::new(),
            track: TrackCurve::new(),
            game_time: 0.0,
            lap: 1,
            lap_start_time: 0.0,
            top_speed: 0.0,
            lap_times: Vec::new(),
            best_lap: f64::INFINITY,
            race_finished: false,
        }
    }

    pub fn init_track(&mut self, waypoints: &[f64], scale: f64) {
        self.track = TrackCurve::from_waypoints(waypoints, scale);
        self.ai_drivers = AIDriver::create_four();
    }

    pub fn reset(&mut self) {
        self.player = CarState::new_player();
        self.ai_drivers = AIDriver::create_four();
        self.game_time = 0.0;
        self.lap = 1;
        self.lap_start_time = 0.0;
        self.top_speed = 0.0;
        self.lap_times.clear();
        self.best_lap = f64::INFINITY;
        self.race_finished = false;
    }

    pub fn update(&mut self, input: &InputState, dt: f64, ai_mode: bool) {
        if self.race_finished { return; }

        self.game_time += dt / 60.0;

        if ai_mode {
            let ai_input = AIDriver::drive_ai(&self.player, &self.track, dt);
            self.player.update(&ai_input, &self.track, dt);
        } else {
            self.player.update(input, &self.track, dt);
        }

        let speed_kmh = (self.player.speed * 100000.0).floor();
        if speed_kmh > self.top_speed {
            self.top_speed = speed_kmh;
        }

        if self.player.check_lap() {
            if self.lap_start_time > 0.0 {
                let lt = self.game_time - self.lap_start_time;
                self.lap_times.push(lt);
                if lt < self.best_lap {
                    self.best_lap = lt;
                }
            }
            self.lap += 1;
            self.lap_start_time = self.game_time;

            if self.lap > 3 {
                self.race_finished = true;
            }
        }

        for ai in self.ai_drivers.iter_mut() {
            ai.update(&self.track, dt);
        }

        self.check_collisions();
    }

    fn check_collisions(&mut self) {
        if self.player.collision_cooldown > 0.0 || self.player.invincible > 0.0 {
            self.player.collision_cooldown = (self.player.collision_cooldown - 1.0 / 60.0).max(0.0);
            self.player.invincible = (self.player.invincible - 1.0 / 60.0).max(0.0);
            return;
        }

        for ai in &self.ai_drivers {
            let dx = self.player.x - ai.car.x;
            let dz = self.player.z - ai.car.z;
            let dist = (dx * dx + dz * dz).sqrt();
            if dist < 4.0 {
                self.player.speed *= 0.5;
                self.player.invincible = 2.0;
                self.player.collision_cooldown = 1.0;
                break;
            }
        }
    }

    pub fn player_x(&self) -> f64 { self.player.x }
    pub fn player_y(&self) -> f64 { self.player.y }
    pub fn player_z(&self) -> f64 { self.player.z }
    pub fn player_angle(&self) -> f64 { self.player.angle }
    pub fn player_speed(&self) -> f64 { self.player.speed }
    pub fn player_nitro(&self) -> f64 { self.player.nitro }
    pub fn player_drifting(&self) -> bool { self.player.drifting }
    pub fn player_drift_angle(&self) -> f64 { self.player.drift_angle }
    pub fn player_invincible(&self) -> f64 { self.player.invincible }
    pub fn player_lateral_offset(&self) -> f64 { self.player.lateral_offset }

    pub fn ai_count(&self) -> usize { self.ai_drivers.len() }
    pub fn ai_x(&self, i: usize) -> f64 { if i < self.ai_drivers.len() { self.ai_drivers[i].car.x } else { 0.0 } }
    pub fn ai_y(&self, i: usize) -> f64 { if i < self.ai_drivers.len() { self.ai_drivers[i].car.y } else { 0.0 } }
    pub fn ai_z(&self, i: usize) -> f64 { if i < self.ai_drivers.len() { self.ai_drivers[i].car.z } else { 0.0 } }
    pub fn ai_angle(&self, i: usize) -> f64 { if i < self.ai_drivers.len() { self.ai_drivers[i].car.angle } else { 0.0 } }
    pub fn ai_color(&self, i: usize) -> u32 { if i < self.ai_drivers.len() { self.ai_drivers[i].color } else { 0 } }

    pub fn track_point_at(&self, t: f64) -> Vec<f64> {
        let p = self.track.get_point_at(t);
        vec![p[0], p[1], p[2]]
    }

    pub fn track_tangent_at(&self, t: f64) -> Vec<f64> {
        let t = self.track.get_tangent_at(t);
        vec![t[0], t[1], t[2]]
    }

    pub fn track_length(&self) -> usize { self.track.points.len() }

    pub fn game_time(&self) -> f64 { self.game_time }
    pub fn lap(&self) -> u32 { self.lap }
    pub fn lap_start_time(&self) -> f64 { self.lap_start_time }
    pub fn top_speed(&self) -> f64 { self.top_speed }
    pub fn best_lap(&self) -> f64 { self.best_lap }
    pub fn race_finished(&self) -> bool { self.race_finished }

    pub fn lap_times_json(&self) -> String {
        let times: Vec<String> = self.lap_times.iter().map(|t| format!("{:.2}", t)).collect();
        format!("[{}]", times.join(","))
    }

    pub fn player_rank(&self) -> u32 {
        let mut rank = 1;
        let player_progress = (self.lap as f64 - 1.0) + self.player.progress;
        for ai in &self.ai_drivers {
            let ai_progress = (ai.car.lap as f64 - 1.0) + ai.car.progress;
            if ai_progress > player_progress {
                rank += 1;
            }
        }
        rank
    }

    pub fn collision_occurred(&self) -> bool {
        self.player.collision_cooldown > 0.5
    }

    pub fn lap_completed(&self) -> bool {
        self.player.lap_completed
    }
}

#[wasm_bindgen]
pub struct InputState {
    pub accelerating: bool,
    pub braking: bool,
    pub boosting: bool,
    pub left: bool,
    pub right: bool,
    pub drifting: bool,
}

#[wasm_bindgen]
impl InputState {
    #[wasm_bindgen(constructor)]
    pub fn new(
        accelerating: bool,
        braking: bool,
        boosting: bool,
        left: bool,
        right: bool,
        drifting: bool,
    ) -> InputState {
        InputState {
            accelerating, braking, boosting, left, right, drifting,
        }
    }
}
