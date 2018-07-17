package com.codemover.xplanner.Security.Controller;

import com.codemover.xplanner.Model.Entity.JAccountUser;
import com.codemover.xplanner.Security.Config.ConstConfig;
import com.codemover.xplanner.Security.Exception.ErrorProfileResponseException;
import com.codemover.xplanner.Security.Util.UserFactory;
import org.apache.oltu.oauth2.client.OAuthClient;
import org.apache.oltu.oauth2.client.URLConnectionClient;
import org.apache.oltu.oauth2.client.request.OAuthBearerClientRequest;
import org.apache.oltu.oauth2.client.request.OAuthClientRequest;
import org.apache.oltu.oauth2.client.response.OAuthAuthzResponse;
import org.apache.oltu.oauth2.client.response.OAuthJSONAccessTokenResponse;
import org.apache.oltu.oauth2.client.response.OAuthResourceResponse;
import org.apache.oltu.oauth2.common.OAuth;
import org.apache.oltu.oauth2.common.exception.OAuthProblemException;
import org.apache.oltu.oauth2.common.exception.OAuthSystemException;
import org.apache.oltu.oauth2.common.message.types.GrantType;
import org.apache.oltu.oauth2.common.token.OAuthToken;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.text.ParseException;
import java.util.HashMap;

import static com.codemover.xplanner.Security.Config.ConstConfig.*;

@Controller
@RequestMapping(value = "api/loginByJAccount")
public class JAccountLogin {
    private final Logger logger = LoggerFactory.getLogger(this.getClass());

    @Autowired
    private ConstConfig constConfig;

    @ResponseBody
    @RequestMapping(value = "/getJAccountLoginUrl", method = RequestMethod.GET)
    HashMap<String, Object> loginByJAccount() {
        HashMap<String, Object> response = new HashMap<>();

        try {
            System.out.println(constConfig.authorizationUrl);
            OAuthClientRequest request = OAuthClientRequest
                    .authorizationLocation(constConfig.authorizationUrl)
                    .setClientId(constConfig.clientID)
                    .setRedirectURI(constConfig.redirectUrl)
                    .setResponseType("code")
                    .setState("xyz")
                    .setScope(constConfig.scope)
                    .buildQueryMessage();
            String UrlForGetCode = request.getLocationUri();
            logger.info("build redirectUrl: '{}'", UrlForGetCode);
            response.put("errMsg", "loginByJAccount:ok");
            response.put("redirectUrl", UrlForGetCode);
            return response;
        } catch (OAuthSystemException e) {
            logger.error("error occured when building url for JAccount authorization", e);
            response.put("errMsg", "loginByJAccount:fail");
            return response;
        }
    }

    @ResponseBody
    @RequestMapping(value = "/authorize", method =
            {RequestMethod.POST, RequestMethod.GET})
    HashMap<String, Object> getCodeFromRedirectUrl(HttpServletRequest servletRequest,
                                                   HttpServletResponse servletResponse) {
        HashMap<String, Object> responseToFrontEnd = new HashMap<>();


        try {
            OAuthAuthzResponse oar = OAuthAuthzResponse.oauthCodeAuthzResponse(servletRequest);
            String code = oar.getCode();

            OAuthClientRequest request = OAuthClientRequest
                    .tokenLocation(constConfig.accessTokenUrl)
                    .setGrantType(GrantType.AUTHORIZATION_CODE)
                    .setClientId(constConfig.clientID)
                    .setClientSecret(constConfig.clientSecret)
                    .setRedirectURI(constConfig.redirectUrl)
                    .setCode(code)
                    .buildQueryMessage();

            OAuthClient clientForAccessToken = new OAuthClient(new URLConnectionClient());
            OAuthJSONAccessTokenResponse jsonAccessTokenResponse = clientForAccessToken.accessToken(request, OAuthJSONAccessTokenResponse.class);
            logger.info("Response access token from JAccount Authorization Server after sending code:'{}'", jsonAccessTokenResponse.getBody());


            OAuthToken oAuthToken = jsonAccessTokenResponse.getOAuthToken();
            String accessToken = oAuthToken.getAccessToken();
            String refreshToken = oAuthToken.getRefreshToken();
            Long expiresIn = oAuthToken.getExpiresIn();
            OAuthClientRequest bearerClientRequest =
                    new OAuthBearerClientRequest(constConfig.profileUrl)
                            .setAccessToken(accessToken).buildQueryMessage();

            OAuthClient clientForGetProfile = new OAuthClient(new URLConnectionClient());
            OAuthResourceResponse authResourceResponse = clientForGetProfile.resource(bearerClientRequest, OAuth.HttpMethod.GET, OAuthResourceResponse.class);
            logger.info("Response User Profile from JAccount Resource Server after sending accessToken:'{}'", authResourceResponse.getBody());


            JAccountUser jAccountUser = UserFactory.createJAccountUser(authResourceResponse.getBody());

            jAccountUser.setAccessToken(accessToken);



            responseToFrontEnd.put("errMsg", "loginByJAccount:ok");
            return responseToFrontEnd;
        } catch (OAuthSystemException | OAuthProblemException e) {
            logger.error("error occurred in authorize", e);
            responseToFrontEnd.put("errMsg", "loginByJAccount:fail");
            return responseToFrontEnd;
        } catch (ParseException | ErrorProfileResponseException e) {
            logger.error("error occurred in handling the profile response", e);
            responseToFrontEnd.put("errMsg", "loginByJAccount:fail");
            return responseToFrontEnd;
        }
    }

}