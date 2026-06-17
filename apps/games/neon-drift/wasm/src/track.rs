pub struct TrackCurve {
    pub points: Vec<[f64; 3]>,
    pub tangents: Vec<[f64; 3]>,
}

impl TrackCurve {
    pub fn new() -> TrackCurve {
        TrackCurve {
            points: Vec::new(),
            tangents: Vec::new(),
        }
    }

    pub fn from_waypoints(waypoints: &[f64], scale: f64) -> TrackCurve {
        let num_waypoints = waypoints.len() / 2;
        let mut pts = Vec::with_capacity(num_waypoints);

        for i in 0..num_waypoints {
            let lat = waypoints[i * 2];
            let lng = waypoints[i * 2 + 1];
            let x = lng * scale;
            let y = 30.0 + (lat * 0.1).sin() * 40.0 + (lng * 0.15).cos() * 20.0;
            let z = lat * scale;
            pts.push([x, y, z]);
        }

        let num_segments = 120;
        let mut points = Vec::with_capacity(num_segments + 1);
        let mut tangents = Vec::with_capacity(num_segments + 1);

        for i in 0..=num_segments {
            let t = i as f64 / num_segments as f64;
            let p = catmull_rom(&pts, t);
            points.push(p);
        }

        for i in 0..=num_segments {
            let p_curr = points[i];
            let p_next = if i < num_segments { points[i + 1] } else { points[0] };
            let tx = p_next[0] - p_curr[0];
            let ty = p_next[1] - p_curr[1];
            let tz = p_next[2] - p_curr[2];
            let len = (tx * tx + ty * ty + tz * tz).sqrt();
            if len > 0.0 {
                tangents.push([tx / len, ty / len, tz / len]);
            } else {
                tangents.push([0.0, 1.0, 0.0]);
            }
        }

        TrackCurve { points, tangents }
    }

    pub fn get_point_at(&self, t: f64) -> [f64; 3] {
        let t = ((t % 1.0) + 1.0) % 1.0;
        let n = self.points.len();
        if n == 0 { return [0.0, 0.0, 0.0]; }

        let idx = t * (n - 1) as f64;
        let i0 = idx.floor() as usize;
        let i1 = (i0 + 1).min(n - 1);
        let frac = idx - i0 as f64;

        [
            lerp(self.points[i0][0], self.points[i1][0], frac),
            lerp(self.points[i0][1], self.points[i1][1], frac),
            lerp(self.points[i0][2], self.points[i1][2], frac),
        ]
    }

    pub fn get_tangent_at(&self, t: f64) -> [f64; 3] {
        let t = ((t % 1.0) + 1.0) % 1.0;
        let n = self.tangents.len();
        if n == 0 { return [0.0, 1.0, 0.0]; }

        let idx = t * (n - 1) as f64;
        let i0 = idx.floor() as usize;
        let i1 = (i0 + 1).min(n - 1);
        let frac = idx - i0 as f64;

        [
            lerp(self.tangents[i0][0], self.tangents[i1][0], frac),
            lerp(self.tangents[i0][1], self.tangents[i1][1], frac),
            lerp(self.tangents[i0][2], self.tangents[i1][2], frac),
        ]
    }
}

fn lerp(a: f64, b: f64, t: f64) -> f64 {
    a + (b - a) * t
}

fn catmull_rom(points: &[[f64; 3]], t: f64) -> [f64; 3] {
    let n = points.len();
    if n == 0 { return [0.0, 0.0, 0.0]; }

    let scaled_t = t * n as f64;
    let segment = scaled_t.floor() as usize;
    let local_t = scaled_t - segment as f64;

    let p0 = points[(segment + n - 1) % n];
    let p1 = points[segment % n];
    let p2 = points[(segment + 1) % n];
    let p3 = points[(segment + 2) % n];

    let t2 = local_t * local_t;
    let t3 = t2 * local_t;

    [
        0.5 * ((2.0 * p1[0])
            + (-p0[0] + p2[0]) * local_t
            + (2.0 * p0[0] - 5.0 * p1[0] + 4.0 * p2[0] - p3[0]) * t2
            + (-p0[0] + 3.0 * p1[0] - 3.0 * p2[0] + p3[0]) * t3),
        0.5 * ((2.0 * p1[1])
            + (-p0[1] + p2[1]) * local_t
            + (2.0 * p0[1] - 5.0 * p1[1] + 4.0 * p2[1] - p3[1]) * t2
            + (-p0[1] + 3.0 * p1[1] - 3.0 * p2[1] + p3[1]) * t3),
        0.5 * ((2.0 * p1[2])
            + (-p0[2] + p2[2]) * local_t
            + (2.0 * p0[2] - 5.0 * p1[2] + 4.0 * p2[2] - p3[2]) * t2
            + (-p0[2] + 3.0 * p1[2] - 3.0 * p2[2] + p3[2]) * t3),
    ]
}
