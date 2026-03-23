/*
    TODO:
    - make employees able to give more cookies than framerate
*/

// file management
const click_sound = document.getElementById('crunch');

// init vars
let bg_color = 0;

let cookies;
if (localStorage.getItem('636f6f6b696573') != null) {
    cookies = parseInt(localStorage.getItem('636f6f6b696573'));
} else {
    cookies = 0;
}
let last_cookies = cookies;
let cookies_per_second = 0.0;
let hundredths_of_a_cookie = 0;

let equipment_lvl;
if (localStorage.getItem('65717569706d656e74') != null) {
    equipment_lvl = parseInt(localStorage.getItem('65717569706d656e74'));
} else {
    equipment_lvl = 1;
}

let equipment_price = (equipment_lvl-1)**2 + 100*(equipment_lvl-1) + 100;

let employees = 0;
if (localStorage.getItem('656d706c6f79656573') != null) {
    employees = parseInt(localStorage.getItem('656d706c6f79656573'));
} else {
    employees = 0;
}

let employee_bonus = employees**2 + 200*employees + 250;

const RES_X = 600;
const RES_Y = 480;

let falling_cookies = [];

// click anti-cheat
let clicks = [];
let click_gaps = [];
let last_ms_for_click = 0;
let range = 0;
let ranges = [];
let range_of_ranges = 0;
let ranges_of_ranges = [];
let suspicion = 0; // how suspicious is the client of the user

// rendering and adjustment vars
let clicker_size = 250;
let falling_size = 50;

let hitbox_size_offset = -65;
let hitbox_diameter = clicker_size + hitbox_size_offset;

let bg_color_drain = 0.5

let shop_button = {
    text: 'shop.', 
    x: 0, 
    y: RES_Y-50, 
    tx: RES_X/8, 
    ty: RES_Y-12, 
    sx: RES_X/4,
    sy: 70,
    rx: 0,
    ry: RES_Y,
    rsx: RES_X,
    rsy: RES_Y
};

// button toggle
let menu_open = null;

// for calc
let dx;
let dy;
let hyp;

// timing
let last_ms_for_second_pulse = 0;
let second_pulse = false;
let fps = 0;

let ms_per_employee = Infinity;
let last_ms_for_employee = 0;

// save progress on exit
function save() {
    localStorage.setItem('636f6f6b696573', cookies);
    localStorage.setItem('65717569706d656e74', equipment_lvl);
    localStorage.setItem('656d706c6f79656573', employees);
    
    localStorage.setItem('cookie_count', cookies);
    localStorage.setItem('equipment', equipment_lvl);
    localStorage.setItem('workers', employees)
}

window.addEventListener('beforeunload', save);

function play_sound(audio, vol) {
    audio.currentTime = 0;
    audio.volume = vol;
    audio.play();
}

// used for formatting large nums
function suffix(num) {
    let ten_powers = floor(Math.log10(num));
    let illion = floor(ten_powers/3) - 1;
    let mantissa = floor(num/(10**((illion+1)*3))*100)/100;

    let suffixes = [
        'k', 
        'm', 'b', 't', 'quad.', 'quint.',
        'sext.', 'sept.', 'oct.', 'non.', 'dec.',
        'undec.', 'duodec.', 'tredec.', 'quadec.', 'quidec.',
        'sexdec.', 'sepdec.', 'octdec.', 'novdec.', 'vig.',
        'unvig.', 'duovig.', 'trevig.', 'quavig.', 'quivig.',
        'sexvig.', 'sepvig.', 'octvig.', 'novvig.', 'trig.',
        'untrig.', 'duotrig.', 'tretrig.', 'quatrig.', 'quitrig.',
        'sextrig.', 'septrig.', 'octtrig.', 'novtrig.', 'quadr.',
        'unquadr.', 'duoquadr.', 'trequadr.', 'quaquadr.', 'quiquadr.',
        'sexquadr.', 'sepquadr.', 'octquadr.', 'novquadr.', 'quinq.'
    ];

    // max number
    if (Number.isNaN(num)) {
        return 'enough.'
    }

    if (num >= 1e306) {
        return 'enough.';
    }

    // negative nums cannot be suffixed
    if (num < 0) {
        return num;
    }
    
    // suffixed nums are string type
    if (illion < 0) {
        return `${num}`;
    } else if (0 <= illion && illion <= (suffixes.length - 1)) {
        return `${mantissa} ${suffixes[illion]}`;
    } else {
        return `${mantissa}(10^${illion*3+3})`
    }
}

// my special anticheat
function calc_click_gap() {
    click_gaps.push(millis() - last_ms_for_click);

    if (click_gaps.length > 15) { // cut off extra click gaps
        click_gaps.splice(0, click_gaps.length - 15);
    }
    last_ms_for_click = millis();

    let smallest_gap = Number.MAX_VALUE; // safest value to use
    let largest_gap = 0; // gaps cannot be less than 0 wide

    for (let i = 0; i < click_gaps.length; i++) { // compare gaps
        let click = click_gaps[i];
        
        if (click < smallest_gap) {
            smallest_gap = click;
        }
        if (click > largest_gap) {
            largest_gap = click;
        }
    }

    // low weight statistic
    range = largest_gap - smallest_gap;
    ranges.push(range);

    if (ranges.length > 15) { // cut off extra ranges
        ranges.splice(0, ranges.length - 15);
    }

    let smallest_range = Number.MAX_VALUE;
    let largest_range = 0;

    for (let i = 0; i < ranges.length; i++) { // compare ranges
        let compared_range = ranges[i];

        if (compared_range < smallest_range) {
            smallest_range = compared_range;
        }
        if (compared_range > largest_range) {
            largest_range = compared_range;
        }
    }

    // medium weight statistic
    range_of_ranges = largest_range - smallest_range;

    ranges_of_ranges.push(range_of_ranges);

    if (ranges_of_ranges.length > 15) { // cut off extra rors
        ranges_of_ranges.splice(0, ranges_of_ranges.length - 15);
    }

    let smallest_range_of_ranges = Number.MAX_VALUE;
    let largest_range_of_ranges = 0;

    for (let i = 0; i < ranges_of_ranges.length; i++) {
        let compared_ror = ranges_of_ranges[i];

        if (compared_ror < smallest_range_of_ranges) {
            smallest_range_of_ranges = compared_ror;
        }
        if (compared_ror > largest_range_of_ranges) {
            largest_range_of_ranges = compared_ror;
        }
    }

    let ultimate_range = largest_range_of_ranges - smallest_range_of_ranges;

    if (ultimate_range < 3 && clicks.length > 5) {
        suspicion++;

        if (suspicion > 30) { // if we are sure enough the player is autoclicking
            // punish the cheater
            cookies -= (abs(ceil(cookies/2)) + clicks.length*equipment_lvl**3);
            save();
            // require further cheating to continue
            suspicion -= 2;
        }
    } else {
        suspicion -= 0.5 * floor(ultimate_range/20);

        if (suspicion < 0) {
            suspicion = 0;
        }
    }

    // console.log(
    //     "================",
    //     "\ngaps: " + click_gaps,
    //     "\nranges: " + ranges,
    //     "\nrors: " + ranges_of_ranges,
    //     "\nrange: " + range,
    //     "\nr of rs: " + range_of_ranges,
    //     "\nfinal: " + ultimate_range,
    //     "\nsus: " + suspicion,
    //     "\n================"
    // );
}

function setup() {
    createCanvas(RES_X, RES_Y); 
    clicker_cookie = loadImage('./assets/cookie.png');
}

function draw() {
    background(bg_color);
    strokeWeight(0);
    textStyle(NORMAL);

    if (employees != 0) {
        ms_per_employee = 1000 / employees;
    }
    if (employees <= getTargetFrameRate()) {
        if ((millis() - last_ms_for_employee) - ms_per_employee >= 0) {
            cookies++;
            last_ms_for_employee = millis();
        }
    } else {
        let additive = employees / getTargetFrameRate();
        let integer_additive = floor(additive);
        let decimal_additive = floor(additive*100) - integer_additive*100;

        cookies += integer_additive;
        hundredths_of_a_cookie += decimal_additive;
    }
    
    if (hundredths_of_a_cookie >= 100) {
        cookies += floor(hundredths_of_a_cookie/100);
        hundredths_of_a_cookie = 0;
    }

    bg_color_drain += 0.01;
    bg_color -= bg_color_drain;

    if (bg_color < 0) {
        bg_color = 0
    } else if (bg_color > 255) {
        bg_color = 255
    }
    
    // on every second
    if (millis() - last_ms_for_second_pulse >= 1000) {
        second_pulse = true;
        last_ms_for_second_pulse = millis();
    } else {
        second_pulse = false;
    }

    if (second_pulse) {
        fps = round(1000/deltaTime);
        cookies_per_second = (cookies - last_cookies);
        last_cookies = cookies;
    }

    // text
    textFont('bahnschrift')
    fill(255 - bg_color); // always visible
    textAlign(LEFT); // fps
    textSize(15);
    text('fps: ' + fps + '/' + getTargetFrameRate(), 5, 20);

    textAlign(CENTER);
    text(`(${suffix(cookies_per_second)}/s)`, RES_X/2, 110);
    textSize(24);
    text('cookies:', RES_X/2, 50);
    textSize(36); // big text
    text(suffix(cookies), RES_X/2, 88);
    

    // hitbox calc
    dx = abs(mouseX - RES_X/2);
    dy = abs(mouseY - RES_Y/2);
    hyp = sqrt(sq(dx) + sq(dy));

    if (hyp <= hitbox_diameter/2) {
        if (clicker_size < 275) {
            clicker_size += 5;
        } else {
            clicker_size = 275;
        }
    } else {
        if (clicker_size > 250) {
            clicker_size -= 5;
        } else {
            clicker_size = 250;
        }
    }

    // cookie
    image(clicker_cookie, RES_X/2-clicker_size/2, RES_Y/2-clicker_size/2, clicker_size, clicker_size);
    // hitbox for debug
    strokeWeight(0);
    fill(0, 0, 0, 0);
    let hitbox_circle = circle(RES_X/2, RES_Y/2, hitbox_diameter);

    // rendering/dropping falling cookies
    for (let i = falling_cookies.length - 1; i >= 0; i--) {
        let cookie = falling_cookies[i];
        if (cookie.y > RES_Y) {
            falling_cookies.splice(i, 1);
        }
        
        image(cookie.img, cookie.x, cookie.y, falling_size, falling_size)
        cookie.y += 5;
    }

    // click limiter
    for (let i = clicks.length - 1; i >= 0; i--) {
        let click = clicks[i];
        click.age += deltaTime;

        if (click.age >= 1000) {
            clicks.splice(i, 1);
        }
    }

    // buttons and menus
    stroke(255 - bg_color);
    strokeWeight(2);
    fill(bg_color);
    rect(shop_button.x, shop_button.y, shop_button.sx, shop_button.sy, 15);
    rect(shop_button.rx, shop_button.ry, shop_button.rsx, shop_button.rsy)
    fill(255 - bg_color);
    strokeWeight(0);
    text(shop_button.text, shop_button.tx, shop_button.ty);
    textAlign(CENTER); // shop items and buttons
    text(suffix(cookies) + '🍪', RES_X/2, shop_button.ty+50);
    textSize(18);
    textAlign(LEFT);
    textStyle(NORMAL);
    text(`upgrade equipment (lv. ${equipment_lvl})`, 50, shop_button.ty+100);
    text(`hire employee (${employees})`, 50, shop_button.ty+190);
    textStyle(ITALIC); // descriptions are offset 14 from titles
    textSize(14);
    textWrap(WORD);
    text('get better cooking equipment to help you make more cookies per click!', 50, shop_button.ty+114, 350);
    text('get some help to make cookies, allows you to make cookies without doing it yourself.', 50, shop_button.ty+204, 350);
    strokeWeight(1);
    line(50, shop_button.ty+70, RES_X-50, shop_button.ty+70);
    line(50, shop_button.ty+250, RES_X-50, shop_button.ty+250);
    line(50, shop_button.ty+160, RES_X-50, shop_button.ty+160);
    line(400, shop_button.ty+70, 400, shop_button.ty+250);
    
    let equipment_button_color = 0;
    let employee_button_color = 0;

    if (
        420 <= mouseX &&
        mouseX <= 530 &&
        shop_button.ty+95 <= mouseY &&
        mouseY <= shop_button.ty+140
    ) {
        equipment_button_color = 255 - bg_color;
    } else {
        equipment_button_color = bg_color;
    }

    if (
        420 <= mouseX &&
        mouseX <= 530 &&
        shop_button.ty+185 <= mouseY &&
        mouseY <= shop_button.ty+230
    ) {
        employee_button_color = 255 - bg_color;
    } else {
        employee_button_color = bg_color;
    }

    fill(equipment_button_color);
    rect(420, shop_button.ty+95, 110, 45);
    fill(employee_button_color);
    rect(420, shop_button.ty+185, 110, 45);

    strokeWeight(0);
    textStyle(NORMAL);
    textAlign(CENTER);
    textSize(20);
    fill(255 - equipment_button_color);
    text(`${suffix(equipment_price)}🍪`, 476, shop_button.ty+124);
    fill(255 - employee_button_color);
    text(`${suffix(employee_bonus)}🍪`, 476, shop_button.ty+215);

    if (menu_open == shop_button) {
        if (shop_button.y > 50) {
            shop_button.y -= 10;
            shop_button.ty -= 10;
            shop_button.ry -= 10;
        }
    } else {
        if (shop_button.y < RES_Y-50) {
            shop_button.y += 10;
            shop_button.ty += 10;
            shop_button.ry += 10;
        }
    }

    frameRate(60);
}

function mousePressed() {
    if (mouseButton == LEFT) {
        // if cookie cliked
        if (hyp <= hitbox_diameter/2 && menu_open == null && clicks.length < 15) {
            cookies += equipment_lvl;
            bg_color_drain = 0.5;
            bg_color += 5;
            play_sound(click_sound, 0.5);

            calc_click_gap()

            clicks.push({
                age: 0
            });
            falling_cookies.push({
                img: clicker_cookie,
                x: random(0, RES_X),
                y: -falling_size
            });
        } else if (hyp <= hitbox_diameter/2 && menu_open == null) { // too many clicks!
            calc_click_gap()
            
            clicks.push({
                age: 0
            })

            if (clicks.length > 18) {
                // punish the cheater
                cookies -= (abs(ceil(cookies/2)) + clicks.length*equipment_lvl**3)
                save();
            }
        }

        // if shop clicked
        if (
            shop_button.x <= mouseX &&
            mouseX <= shop_button.x + shop_button.sx && 
            shop_button.y <= mouseY &&
            mouseY <= (shop_button.y + shop_button.sy)
        ) {
            if (menu_open == null) {
                menu_open = shop_button;
            } else {
                menu_open = null;
            }
        }

        // shop menu buttons
        if (menu_open == shop_button) {
            // upgrade equipment button
            if (
                420 <= mouseX &&
                mouseX <= 530 &&
                shop_button.ty+95 <= mouseY &&
                mouseY <= shop_button.ty+140 &&
                cookies >= equipment_price
            ) {
                equipment_lvl++;
                cookies -= equipment_price;
                equipment_price = (equipment_lvl-1)**2 + 100*(equipment_lvl-1) + 100;
            }
            
            // hire employee button
            if (
                420 <= mouseX &&
                mouseX <= 530 &&
                shop_button.ty+185 <= mouseY &&
                mouseY <= shop_button.ty+230 &&
                cookies >= employee_bonus
            ) {
                employees++;
                cookies -= employee_bonus;
                employee_bonus = employees**2 + 200*employees + 250;
            }
        }
    }
}