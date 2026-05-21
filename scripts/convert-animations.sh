#!/usr/bin/env bash
set -euo pipefail

# Convert Oracube-Core .mov/.gif animations to .webm for Electron UI
# Usage: ./scripts/convert-animations.sh

ORACUBE_CORE="${HOME}/Documents/project/python/ElectronUI/Oracube-Core"
OUTPUT_DIR="$(cd "$(dirname "$0")/.." && pwd)/data/animations"

mkdir -p "${OUTPUT_DIR}"

# Animation source directories
ANIM_DIRS=(
  "${ORACUBE_CORE}/oracube/hardware/display_animations/animations_data/oracube_emotions"
)

echo "Converting animations to ${OUTPUT_DIR}..."

for dir in "${ANIM_DIRS[@]}"; do
  if [ ! -d "${dir}" ]; then
    echo "  SKIP: ${dir} not found"
    continue
  fi

  find "${dir}" -type f \( -iname "*.mov" -o -iname "*.gif" \) | while read -r file; do
    basename=$(basename "${file}")
    name="${basename%.*}"
    output="${OUTPUT_DIR}/${name}.webm"

    if [ -f "${output}" ]; then
      echo "  EXISTS: ${name}.webm"
      continue
    fi

    echo "  CONVERT: ${basename} → ${name}.webm"
    ffmpeg -y -i "${file}" \
      -c:v libvpx-vp9 \
      -b:v 1M \
      -pix_fmt yuv420p \
      -an \
      "${output}" 2>/dev/null
  done
done

echo "Done. Animations in: ${OUTPUT_DIR}"
ls -lh "${OUTPUT_DIR}/"
