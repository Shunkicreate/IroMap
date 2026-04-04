use std::mem;
use std::slice;

type BucketRank = (usize, u32);

struct RegisteredStore {
    x: Vec<u32>,
    y: Vec<u32>,
    r: Vec<u8>,
    g: Vec<u8>,
    b: Vec<u8>,
    lab_l: Vec<u16>,
    lab_a: Vec<i16>,
    lab_b: Vec<i16>,
    hue: Vec<u16>,
    saturation: Vec<u16>,
    lightness: Vec<u16>,
}

static mut REGISTERED_STORES: Option<Vec<Option<RegisteredStore>>> = None;
static mut REGISTERED_INDEXES: Option<Vec<Option<Vec<u32>>>> = None;

fn stores() -> &'static mut Vec<Option<RegisteredStore>> {
    unsafe { REGISTERED_STORES.get_or_insert_with(Vec::new) }
}

fn indexes_registry() -> &'static mut Vec<Option<Vec<u32>>> {
    unsafe { REGISTERED_INDEXES.get_or_insert_with(Vec::new) }
}

#[no_mangle]
pub extern "C" fn alloc(len: usize) -> *mut u8 {
    let mut buf = Vec::<u8>::with_capacity(len);
    let ptr = buf.as_mut_ptr();
    mem::forget(buf);
    ptr
}

#[no_mangle]
pub extern "C" fn dealloc(ptr: *mut u8, len: usize) {
    unsafe {
        let _ = Vec::from_raw_parts(ptr, 0, len);
    }
}

#[no_mangle]
pub extern "C" fn register_store(
    x_ptr: *const u32,
    y_ptr: *const u32,
    r_ptr: *const u8,
    g_ptr: *const u8,
    b_ptr: *const u8,
    lab_l_ptr: *const u16,
    lab_a_ptr: *const i16,
    lab_b_ptr: *const i16,
    hue_ptr: *const u16,
    saturation_ptr: *const u16,
    lightness_ptr: *const u16,
    color_len: usize,
) -> u32 {
    let x = unsafe { slice::from_raw_parts(x_ptr, color_len) };
    let y = unsafe { slice::from_raw_parts(y_ptr, color_len) };
    let r = unsafe { slice::from_raw_parts(r_ptr, color_len) };
    let g = unsafe { slice::from_raw_parts(g_ptr, color_len) };
    let b = unsafe { slice::from_raw_parts(b_ptr, color_len) };
    let lab_l = unsafe { slice::from_raw_parts(lab_l_ptr, color_len) };
    let lab_a = unsafe { slice::from_raw_parts(lab_a_ptr, color_len) };
    let lab_b = unsafe { slice::from_raw_parts(lab_b_ptr, color_len) };
    let hue = unsafe { slice::from_raw_parts(hue_ptr, color_len) };
    let saturation = unsafe { slice::from_raw_parts(saturation_ptr, color_len) };
    let lightness = unsafe { slice::from_raw_parts(lightness_ptr, color_len) };
    let store = RegisteredStore {
        x: x.to_vec(),
        y: y.to_vec(),
        r: r.to_vec(),
        g: g.to_vec(),
        b: b.to_vec(),
        lab_l: lab_l.to_vec(),
        lab_a: lab_a.to_vec(),
        lab_b: lab_b.to_vec(),
        hue: hue.to_vec(),
        saturation: saturation.to_vec(),
        lightness: lightness.to_vec(),
    };

    let stores = stores();
    stores.push(Some(store));
    stores.len() as u32
}

#[no_mangle]
pub extern "C" fn release_store(store_id: u32) {
    if store_id == 0 {
        return;
    }
    let index = (store_id - 1) as usize;
    let stores = stores();
    if let Some(slot) = stores.get_mut(index) {
        *slot = None;
    }
}

#[no_mangle]
pub extern "C" fn register_indexes(indexes_ptr: *const u32, indexes_len: usize) -> u32 {
    let indexes = unsafe { slice::from_raw_parts(indexes_ptr, indexes_len) };
    let registry = indexes_registry();
    registry.push(Some(indexes.to_vec()));
    registry.len() as u32
}

#[no_mangle]
pub extern "C" fn release_indexes(indexes_id: u32) {
    if indexes_id == 0 {
        return;
    }
    let index = (indexes_id - 1) as usize;
    let registry = indexes_registry();
    if let Some(slot) = registry.get_mut(index) {
        *slot = None;
    }
}

fn build_ranked_buckets(
    r: &[u8],
    g: &[u8],
    b: &[u8],
    indexes_ptr: *const u32,
    indexes_len: usize,
    use_full_store: bool,
    bucket_size: u8,
) -> Vec<BucketRank> {
    let mut buckets = vec![0u32; 4096];
    let bucket_size_u32 = bucket_size as u32;

    if use_full_store {
        for index in 0..r.len() {
            let bucket_r = (r[index] as u32 / bucket_size_u32).min(15);
            let bucket_g = (g[index] as u32 / bucket_size_u32).min(15);
            let bucket_b = (b[index] as u32 / bucket_size_u32).min(15);
            let bucket_index = ((bucket_r << 8) | (bucket_g << 4) | bucket_b) as usize;
            buckets[bucket_index] += 1;
        }
    } else {
        let indexes = unsafe { slice::from_raw_parts(indexes_ptr, indexes_len) };
        for raw_index in indexes {
            let index = *raw_index as usize;
            if index >= r.len() {
                continue;
            }
            let bucket_r = (r[index] as u32 / bucket_size_u32).min(15);
            let bucket_g = (g[index] as u32 / bucket_size_u32).min(15);
            let bucket_b = (b[index] as u32 / bucket_size_u32).min(15);
            let bucket_index = ((bucket_r << 8) | (bucket_g << 4) | bucket_b) as usize;
            buckets[bucket_index] += 1;
        }
    }

    let mut ranked: Vec<BucketRank> = buckets
        .into_iter()
        .enumerate()
        .filter(|(_, count)| *count > 0)
        .collect();
    ranked.sort_unstable_by(|left, right| right.1.cmp(&left.1));
    ranked
}

fn write_output(
    ranked: Vec<BucketRank>,
    bucket_size: u8,
    max_points: usize,
    out_colors_ptr: *mut u8,
    out_counts_ptr: *mut u32,
    out_ratios_ptr: *mut f32,
    total_count: usize,
) -> usize {
    let output_len = ranked.len().min(max_points);
    let out_colors = unsafe { slice::from_raw_parts_mut(out_colors_ptr, output_len * 3) };
    let out_counts = unsafe { slice::from_raw_parts_mut(out_counts_ptr, output_len) };
    let out_ratios = unsafe { slice::from_raw_parts_mut(out_ratios_ptr, output_len) };
    let total = if total_count == 0 { 1.0 } else { total_count as f32 };

    for (offset, (bucket_index, count)) in ranked.into_iter().take(output_len).enumerate() {
        let bucket_r = ((bucket_index >> 8) & 0x0f) as u8 * bucket_size;
        let bucket_g = ((bucket_index >> 4) & 0x0f) as u8 * bucket_size;
        let bucket_b = (bucket_index & 0x0f) as u8 * bucket_size;
        let color_offset = offset * 3;
        out_colors[color_offset] = bucket_r;
        out_colors[color_offset + 1] = bucket_g;
        out_colors[color_offset + 2] = bucket_b;
        out_counts[offset] = count;
        out_ratios[offset] = count as f32 / total;
    }

    output_len
}

#[no_mangle]
pub extern "C" fn build_cube_points(
    r_ptr: *const u8,
    g_ptr: *const u8,
    b_ptr: *const u8,
    color_len: usize,
    indexes_ptr: *const u32,
    indexes_len: usize,
    use_full_store: u8,
    bucket_size: u8,
    max_points: usize,
    out_colors_ptr: *mut u8,
    out_counts_ptr: *mut u32,
    out_ratios_ptr: *mut f32,
) -> usize {
    let r = unsafe { slice::from_raw_parts(r_ptr, color_len) };
    let g = unsafe { slice::from_raw_parts(g_ptr, color_len) };
    let b = unsafe { slice::from_raw_parts(b_ptr, color_len) };
    let use_full_store = use_full_store != 0;
    let ranked = build_ranked_buckets(r, g, b, indexes_ptr, indexes_len, use_full_store, bucket_size);
    let total_count = if use_full_store { color_len } else { indexes_len };
    write_output(
        ranked,
        bucket_size,
        max_points,
        out_colors_ptr,
        out_counts_ptr,
        out_ratios_ptr,
        total_count,
    )
}

#[no_mangle]
pub extern "C" fn build_cube_points_from_store(
    store_id: u32,
    indexes_ptr: *const u32,
    indexes_len: usize,
    use_full_store: u8,
    bucket_size: u8,
    max_points: usize,
    out_colors_ptr: *mut u8,
    out_counts_ptr: *mut u32,
    out_ratios_ptr: *mut f32,
) -> usize {
    if store_id == 0 {
        return 0;
    }

    let index = (store_id - 1) as usize;
    let stores = stores();
    let Some(Some(store)) = stores.get(index) else {
        return 0;
    };

    let use_full_store = use_full_store != 0;
    let ranked = build_ranked_buckets(
        &store.r,
        &store.g,
        &store.b,
        indexes_ptr,
        indexes_len,
        use_full_store,
        bucket_size,
    );
    let total_count = if use_full_store {
        store.r.len()
    } else {
        indexes_len
    };
    write_output(
        ranked,
        bucket_size,
        max_points,
        out_colors_ptr,
        out_counts_ptr,
        out_ratios_ptr,
        total_count,
    )
}

#[no_mangle]
pub extern "C" fn build_derived_selection(
    store_id: u32,
    indexes_id: u32,
    bucket_size: u8,
    max_points: usize,
    out_selected_count_ptr: *mut u32,
    out_colors_ptr: *mut u8,
    out_counts_ptr: *mut u32,
    out_ratios_ptr: *mut f32,
) -> usize {
    if store_id == 0 || indexes_id == 0 {
        unsafe {
            *out_selected_count_ptr = 0;
        }
        return 0;
    }

    let store_index = (store_id - 1) as usize;
    let indexes_index = (indexes_id - 1) as usize;
    let stores = stores();
    let registry = indexes_registry();
    let Some(Some(store)) = stores.get(store_index) else {
        unsafe {
            *out_selected_count_ptr = 0;
        }
        return 0;
    };
    let Some(Some(indexes)) = registry.get(indexes_index) else {
        unsafe {
            *out_selected_count_ptr = 0;
        }
        return 0;
    };

    let ranked = build_ranked_buckets(
        &store.r,
        &store.g,
        &store.b,
        indexes.as_ptr(),
        indexes.len(),
        false,
        bucket_size,
    );
    unsafe {
        *out_selected_count_ptr = indexes.len() as u32;
    }
    write_output(
        ranked,
        bucket_size,
        max_points,
        out_colors_ptr,
        out_counts_ptr,
        out_ratios_ptr,
        indexes.len(),
    )
}

#[no_mangle]
pub extern "C" fn materialize_selected_samples_from_store(
    store_id: u32,
    indexes_id: u32,
    out_x_ptr: *mut u32,
    out_y_ptr: *mut u32,
    out_colors_ptr: *mut u8,
    out_lab_l_ptr: *mut u16,
    out_lab_a_ptr: *mut i16,
    out_lab_b_ptr: *mut i16,
    out_hue_ptr: *mut u16,
    out_saturation_ptr: *mut u16,
    out_lightness_ptr: *mut u16,
) -> usize {
    if store_id == 0 || indexes_id == 0 {
        return 0;
    }

    let store_index = (store_id - 1) as usize;
    let indexes_index = (indexes_id - 1) as usize;
    let stores = stores();
    let registry = indexes_registry();
    let Some(Some(store)) = stores.get(store_index) else {
        return 0;
    };
    let Some(Some(indexes)) = registry.get(indexes_index) else {
        return 0;
    };

    let out_x = unsafe { slice::from_raw_parts_mut(out_x_ptr, indexes.len()) };
    let out_y = unsafe { slice::from_raw_parts_mut(out_y_ptr, indexes.len()) };
    let out_colors = unsafe { slice::from_raw_parts_mut(out_colors_ptr, indexes.len() * 3) };
    let out_lab_l = unsafe { slice::from_raw_parts_mut(out_lab_l_ptr, indexes.len()) };
    let out_lab_a = unsafe { slice::from_raw_parts_mut(out_lab_a_ptr, indexes.len()) };
    let out_lab_b = unsafe { slice::from_raw_parts_mut(out_lab_b_ptr, indexes.len()) };
    let out_hue = unsafe { slice::from_raw_parts_mut(out_hue_ptr, indexes.len()) };
    let out_saturation = unsafe { slice::from_raw_parts_mut(out_saturation_ptr, indexes.len()) };
    let out_lightness = unsafe { slice::from_raw_parts_mut(out_lightness_ptr, indexes.len()) };

    let mut written = 0usize;
    for raw_index in indexes {
        let index = *raw_index as usize;
        if index >= store.r.len() {
            continue;
        }
        out_x[written] = store.x[index];
        out_y[written] = store.y[index];
        let color_offset = written * 3;
        out_colors[color_offset] = store.r[index];
        out_colors[color_offset + 1] = store.g[index];
        out_colors[color_offset + 2] = store.b[index];
        out_lab_l[written] = store.lab_l[index];
        out_lab_a[written] = store.lab_a[index];
        out_lab_b[written] = store.lab_b[index];
        out_hue[written] = store.hue[index];
        out_saturation[written] = store.saturation[index];
        out_lightness[written] = store.lightness[index];
        written += 1;
    }

    written
}

#[no_mangle]
pub extern "C" fn build_derived_selection_projection(
    store_id: u32,
    indexes_id: u32,
    bucket_size: u8,
    max_points: usize,
    out_selected_count_ptr: *mut u32,
    out_x_ptr: *mut u32,
    out_y_ptr: *mut u32,
    out_sample_colors_ptr: *mut u8,
    out_lab_l_ptr: *mut u16,
    out_lab_a_ptr: *mut i16,
    out_lab_b_ptr: *mut i16,
    out_hue_ptr: *mut u16,
    out_saturation_ptr: *mut u16,
    out_lightness_ptr: *mut u16,
    out_cube_colors_ptr: *mut u8,
    out_cube_counts_ptr: *mut u32,
    out_cube_ratios_ptr: *mut f32,
) -> usize {
    if store_id == 0 || indexes_id == 0 {
        unsafe {
            *out_selected_count_ptr = 0;
        }
        return 0;
    }

    let store_index = (store_id - 1) as usize;
    let indexes_index = (indexes_id - 1) as usize;
    let stores = stores();
    let registry = indexes_registry();
    let Some(Some(store)) = stores.get(store_index) else {
        unsafe {
            *out_selected_count_ptr = 0;
        }
        return 0;
    };
    let Some(Some(indexes)) = registry.get(indexes_index) else {
        unsafe {
            *out_selected_count_ptr = 0;
        }
        return 0;
    };

    let out_x = unsafe { slice::from_raw_parts_mut(out_x_ptr, indexes.len()) };
    let out_y = unsafe { slice::from_raw_parts_mut(out_y_ptr, indexes.len()) };
    let out_sample_colors = unsafe { slice::from_raw_parts_mut(out_sample_colors_ptr, indexes.len() * 3) };
    let out_lab_l = unsafe { slice::from_raw_parts_mut(out_lab_l_ptr, indexes.len()) };
    let out_lab_a = unsafe { slice::from_raw_parts_mut(out_lab_a_ptr, indexes.len()) };
    let out_lab_b = unsafe { slice::from_raw_parts_mut(out_lab_b_ptr, indexes.len()) };
    let out_hue = unsafe { slice::from_raw_parts_mut(out_hue_ptr, indexes.len()) };
    let out_saturation = unsafe { slice::from_raw_parts_mut(out_saturation_ptr, indexes.len()) };
    let out_lightness = unsafe { slice::from_raw_parts_mut(out_lightness_ptr, indexes.len()) };

    let mut buckets = vec![0u32; 4096];
    let bucket_size_u32 = bucket_size as u32;
    let mut written = 0usize;

    for raw_index in indexes {
        let index = *raw_index as usize;
        if index >= store.r.len() {
            continue;
        }

        out_x[written] = store.x[index];
        out_y[written] = store.y[index];
        let color_offset = written * 3;
        out_sample_colors[color_offset] = store.r[index];
        out_sample_colors[color_offset + 1] = store.g[index];
        out_sample_colors[color_offset + 2] = store.b[index];
        out_lab_l[written] = store.lab_l[index];
        out_lab_a[written] = store.lab_a[index];
        out_lab_b[written] = store.lab_b[index];
        out_hue[written] = store.hue[index];
        out_saturation[written] = store.saturation[index];
        out_lightness[written] = store.lightness[index];

        let bucket_r = (store.r[index] as u32 / bucket_size_u32).min(15);
        let bucket_g = (store.g[index] as u32 / bucket_size_u32).min(15);
        let bucket_b = (store.b[index] as u32 / bucket_size_u32).min(15);
        let bucket_index = ((bucket_r << 8) | (bucket_g << 4) | bucket_b) as usize;
        buckets[bucket_index] += 1;
        written += 1;
    }

    unsafe {
        *out_selected_count_ptr = written as u32;
    }

    let mut ranked: Vec<BucketRank> = buckets
        .into_iter()
        .enumerate()
        .filter(|(_, count)| *count > 0)
        .collect();
    ranked.sort_unstable_by(|left, right| right.1.cmp(&left.1));

    write_output(
        ranked,
        bucket_size,
        max_points,
        out_cube_colors_ptr,
        out_cube_counts_ptr,
        out_cube_ratios_ptr,
        written,
    )
}
