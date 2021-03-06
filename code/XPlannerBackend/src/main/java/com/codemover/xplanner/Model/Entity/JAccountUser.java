package com.codemover.xplanner.Model.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import javax.persistence.*;

@Entity
@PrimaryKeyJoinColumn(name = "user_id")
@Table(name = "JAccount_user")
public class JAccountUser extends User {

    private String realName;


    private String jAccountName;


    private String uniqueId;


    private String studentId;


    private String classNumber;


    private String accessToken;

    private String refreshToken;

    private String openId;

    @Basic
    @Column(name = "jaccount_name")
    public String getjAccountName() {
        return jAccountName;
    }





    public void setjAccountName(String jAccountName) {
        this.jAccountName = jAccountName;
    }

    @Basic
    @Column(name = "class_number")
    public String getClassNumber() {
        return classNumber;
    }

    public void setClassNumber(String classNumber) {
        this.classNumber = classNumber;
    }


    @Basic
    @Column(name = "unique_id")
    @JsonIgnore
    public String getUniqueId() {
        return uniqueId;
    }

    public void setUniqueId(String uniqueId) {
        this.uniqueId = uniqueId;
    }


    @Basic
    @Column(name = "student_id")
    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    @Basic
    @Column(name = "user_realName")
    public String getRealName() {
        return realName;
    }

    public void setRealName(String realName) {
        this.realName = realName;
    }

    @Basic
    @Column(name = "access_token")
    @JsonIgnore
    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }
    @Basic
    @Column(name = "refresh_token")
    @JsonIgnore
    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    @Basic
    @Column(unique = true, name="open_id")
    @JsonIgnore
    public String getOpenId() {
        return openId;
    }

    public void setOpenId(String openId) {
        this.openId = openId;
    }
}
