package com.mybyteclub.byteclub.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import jakarta.servlet.http.HttpServletRequest;

@Controller
public class WebController {

    @GetMapping({
        "/", 
        "/catalog",
        "/auth", 
        "/profile", 
        "/favorites", 
        "/search", 
        "/admin", 
        "/product/{id:\\d+}" 
    })
    public String forwardToFrontend() {
        return "forward:/index.html";
    }

    @GetMapping("/{path:^(?!error$)[^\\.]*}")
    public String forward404(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path.startsWith("/api/")) {
            return null; 
        }
        return "forward:/index.html";
    }
}
