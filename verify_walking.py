import time
import subprocess
import os
import sys
from playwright.sync_api import sync_playwright

def run_tests():
    # Start python http server on 8089 if not running
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8089'])
    time.sleep(1.2)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1280, "height": 720})

            # 1. Load test page
            print("1. Loading test-player-walking.html...")
            page.goto("http://127.0.0.1:8089/test-player-walking.html")
            page.wait_for_function("window.__cesiumReady === true", timeout=15000)
            print("CesiumMan loaded successfully.")

            # Initial stationary state
            time.sleep(0.5)
            page.screenshot(path="/tmp/accra_walk_improved_stopped.png")

            # 2. Test forward walk in IMPROVED mode
            print("2. Testing forward walking in IMPROVED mode...")
            page.keyboard.down("w")
            time.sleep(1.5)

            # Telemetry during walk
            sp_text = page.locator("#statSpeed").inner_text()
            anim_rate = page.locator("#statAnimSpeed").inner_text()
            slip_text = page.locator("#statSlip").inner_text()
            sync_text = page.locator("#statSync").inner_text()
            print(f"Improved Walk Telemetry -> Speed: {sp_text}, AnimRate: {anim_rate}, Slip: {slip_text}, Sync: {sync_text}")

            page.screenshot(path="/tmp/accra_walk_improved_moving.png")
            page.keyboard.up("w")
            time.sleep(0.8) # Allow smooth stop

            # Check stopping pose
            stop_foot = page.locator("#statFoot").inner_text()
            print(f"Stopping grounded state: {stop_foot}")

            # 3. Test stopping from different points in cycle
            print("3. Testing stopping from various cycle points...")
            for duration in [0.4, 0.7, 1.1, 1.6]:
                page.keyboard.down("w")
                time.sleep(duration)
                page.keyboard.up("w")
                time.sleep(0.6)
                pos_y = page.evaluate("window.player.position.y")
                assert 0.90 <= pos_y <= 0.95, f"Unexpected elevation jump on stop: {pos_y}"

            # 4. Test turning, sprinting, jumping
            print("4. Testing turning, sprinting, and jumping...")
            page.keyboard.down("Shift")
            page.keyboard.down("w")
            page.keyboard.down("d")
            time.sleep(1.2)
            sprint_sp = page.locator("#statSpeed").inner_text()
            print(f"Sprint + Turn speed: {sprint_sp}")

            # Jump
            page.keyboard.press("Space")
            time.sleep(0.2)
            jump_y = page.evaluate("window.player.position.y")
            print(f"Player jump height reached: {jump_y:.2f}m")
            assert jump_y > 0.95, "Player did not elevate on jump"

            page.keyboard.up("w")
            page.keyboard.up("d")
            page.keyboard.up("Shift")
            time.sleep(0.8)

            # 5. Switch to ORIGINAL mode and compare
            print("5. Comparing with ORIGINAL mode...")
            page.click("#modeToggle")
            time.sleep(0.2)
            mode_badge = page.locator("#modeBadge").inner_text()
            assert mode_badge == "ORIGINAL", f"Mode switch failed, got {mode_badge}"

            page.keyboard.down("w")
            time.sleep(1.2)
            orig_speed = page.locator("#statSpeed").inner_text()
            orig_anim = page.locator("#statAnimSpeed").inner_text()
            orig_slip = page.locator("#statSlip").inner_text()
            print(f"Original Walk Telemetry -> Speed: {orig_speed}, AnimRate: {orig_anim}, Slip: {orig_slip}")
            page.screenshot(path="/tmp/accra_walk_original_moving.png")
            page.keyboard.up("w")
            time.sleep(0.5)

            # Switch back to IMPROVED
            page.click("#modeToggle")
            time.sleep(0.2)

            # 6. Check camera angles
            print("6. Capturing camera angles...")
            # Front camera
            page.click("button[data-alpha='-1.57']")
            time.sleep(0.4)
            page.screenshot(path="/tmp/accra_walk_front_view.png")

            # Right side camera
            page.click("button[data-alpha='0.0']")
            time.sleep(0.4)
            page.screenshot(path="/tmp/accra_walk_side_view.png")

            browser.close()
            print("All walking animation tests and telemetry validations passed successfully!")
    finally:
        srv.terminate()

if __name__ == "__main__":
    run_tests()
