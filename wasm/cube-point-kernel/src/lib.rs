use std::mem;
use std::slice;

type BucketRank = (usize, u32);

struct RegisteredStore {
    r: Vec<u8>,
    g: Vec<u8>,
    b: Vec<u8>,
}

static mut REGISTERED_STORES: Option<Vec<Option<RegisteredStore>>> = None;

fn stores() -> &'static mut Vec<Option<RegisteredStore>> {
    unsafe { REGISTERED_STORES.get_or_insert_with(Vec::new) }
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
    r_ptr: *const u8,
    g_ptr: *const u8,
    b_ptr: *const u8,
    color_len: usize,
) -> u32 {
    let r = unsafe { slice::from_raw_parts(r_ptr, color_len) };
    let g = unsafe { slice::from_raw_parts(g_ptr, color_len) };
    let b = unsafe { slice::from_raw_parts(b_ptr, color_len) };
    let store = RegisteredStore {
        r: r.to_vec(),
        g: g.to_vec(),
        b: b.to_vec(),
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

fn build_ranked_buckets(
    r: &[u8],
    g: &[u8],
    b: &[u8],
    indexes_ptr: *const u32,
    indexes_len: usize,
    bucket_size: u8,
) -> Vec<BucketRank> {
    let mut buckets = vec![0u32; 4096];
    let bucket_size_u32 = bucket_size as u32;

    if indexes_len == 0 {
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
    bucket_size: u8,
    max_points: usize,
    out_colors_ptr: *mut u8,
    out_counts_ptr: *mut u32,
    out_ratios_ptr: *mut f32,
) -> usize {
    let r = unsafe { slice::from_raw_parts(r_ptr, color_len) };
    let g = unsafe { slice::from_raw_parts(g_ptr, color_len) };
    let b = unsafe { slice::from_raw_parts(b_ptr, color_len) };
    let ranked = build_ranked_buckets(r, g, b, indexes_ptr, indexes_len, bucket_size);
    let total_count = if indexes_len == 0 { color_len } else { indexes_len };
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

    let ranked = build_ranked_buckets(
        &store.r,
        &store.g,
        &store.b,
        indexes_ptr,
        indexes_len,
        bucket_size,
    );
    let total_count = if indexes_len == 0 {
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
