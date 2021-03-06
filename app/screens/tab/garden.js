import React, { Component } from 'react';
import { StyleSheet, ScrollView, Image, TouchableOpacity, View, Linking } from 'react-native';
import firebase from 'react-native-firebase';
import LinearGradient from 'react-native-linear-gradient';
import { connect } from 'react-redux';
import { LoginManager } from 'react-native-fbsdk';
import PropTypes from 'prop-types';
import { NavigationActions } from 'react-navigation';
import { compose } from 'react-apollo';
import { resetLocalStorage } from '@services/apollo/dataSync';
import ProfileAction from '@components/profile/profileAction';
import { Colors, Gradients } from '@theme';
import SupportIcon from '@assets/icons/ic_support.png';
import SupportIconActive from '@assets/icons/ic_support_active.png';
import AuthService from '@services/auth';
import AuthAction from '@redux/actions/auth';
import { withRemoveAppToken, withAccount } from '@services/apollo/profile';
import { getDeviceId } from '@helpers/device';
import { trans } from '@lang/i18n';
import { AppText, Title } from '@components/utils/texts';
import Package from '@components/garden/subscriptionPackage';
import Header from '@components/garden/header';
import HelpMore from '@components/garden/helpMore';
import HowItWorks from '@components/garden/howItWorks';
import Costs from '@components/garden/costs';
import { withSupport, withGenerateClientToken } from '@services/apollo/support';
import { showPayment } from '@services/braintree/braintreePayment';
import GithubIcon from '@assets/icons/ic_github.png';
import OpenAPIIcon from '@assets/icons/ic_open_api.png';
import ConfirmModal from '@components/common/confirmModal';

const styles = StyleSheet.create({
  curves: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  header: {
    padding: 30,
    paddingTop: 50,
  },
  heading: {
    maxWidth: 220,
    lineHeight: 46,
    marginBottom: 24,
  },
  headerDivider: {
    height: 1,
    width: 64,
    backgroundColor: Colors.text.lightGray,
    marginTop: 24,
    marginBottom: 32,
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  linkContent: {
    padding: 30,
    marginBottom: 32,
  },
  miniDivider: {
    height: 1,
    width: 64,
    backgroundColor: Colors.text.lightGray,
    marginTop: 24,
    marginBottom: 26,
  },
});

class Garden extends Component {
  static navigationOptions = {
    header: null,
    tabBarLabel: 'Garden',
    tabBarIcon: ({ focused }) => <Image source={focused ? SupportIconActive : SupportIcon} />,
    tabBarOnPress: ({ scene, jumpToIndex }) => {
      if (scene.focused) {
        const navigationInRoute = scene.route;
        if (!!navigationInRoute
          && !!navigationInRoute.params
          && !!navigationInRoute.params.scrollToTop) {
          navigationInRoute.params.scrollToTop();
        }
      }
      jumpToIndex(4);
    },
  };

  constructor(props) {
    super(props);
    this.scrollView = null;
    this.state = {
      subscribing: false,
      showConfirmModal: false,
      alertMessage: '',
    };
  }

  componentWillMount() {
    const { navigation } = this.props;

    navigation.setParams({ scrollToTop: this.scrollToTop });
    navigation.addListener('didBlur', e => this.tabEvent(e, 'didBlur'));
  }

  componentDidMount() {
    const { subscribeToUpdatedProfile, data } = this.props;

    subscribeToUpdatedProfile({ id: data.profile.id });
  }

  onSupportSubscribe = (planId) => {
    const { support, generateClientToken } = this.props;

    showPayment(generateClientToken, (error, paymentMethodNonce) => {
      if (error) {
        console.warn(error);
        this.setState({ showConfirmModal: true, alertMessage: trans('profile.subscribe_failed') });
        return;
      }

      this.setState({ subscribing: true, showConfirmModal: true });

      support({ planId, paymentMethodNonce })
        .then(() => {
          this.setState({ subscribing: false, alertMessage: trans('profile.subscribed_success') });
        })
        .catch((e) => {
          console.warn(e);
          this.setState({ subscribing: false, alertMessage: trans('profile.subscribe_failed') });
        });
    });
  }

  tabEvent = (e, type) => {
    // if (this.scrollView && type === 'didBlur') {
    //   this.scrollView.scrollTo({ x: 0, y: 0, animated: true });
    // }
  }

  scrollToTop = () => {
    if (this.scrollView) {
      this.scrollView.scrollTo({ x: 0, y: 0, animated: true });
    }
  }

  logout = () => {
    const { logout, removeAppToken } = this.props;
    this.setState({ loading: true }, async () => {
      await removeAppToken(getDeviceId());
      await firebase.notifications().cancelAllNotifications();
      logout()
        .then(() => LoginManager.logOut())
        .then(() => this.reset())
        .catch(() => this.reset());
    });
  }

  reset = async () => {
    const { navigation } = this.props;
    await resetLocalStorage();
    const resetAction = NavigationActions.reset({
      index: 0,
      actions: [NavigationActions.navigate({ routeName: 'Splash' })],
    });
    navigation.dispatch(resetAction);
  }

  redirect = (path) => {
    const { navigation } = this.props;

    navigation.navigate(path);
  }

  openLink = (link) => {
    Linking.canOpenURL(link).then((supported) => {
      if (supported) {
        Linking.openURL(link);
      } else {
        console.warn('Cannot open given URL.');
      }
    });
  };

  render() {
    const { data } = this.props;
    const { subscribing, showConfirmModal, alertMessage } = this.state;

    if (!data.profile) return null;

    const supporter = data.profile.isSupporter || false;
    // const headingLabel = supporter ? trans('profile.you_are_awesome')
    //   : trans('profile.this_app_is_a_self_sustaining_garden');
    // const infoLabel = supporter ? trans('profile.right_now_you_support')
    //   : trans('profile.all_of_us_who_use_the_app_helps_to_work_with_money');

    const headingLabel = supporter ? trans('profile.you_are_awesome')
      : trans('profile.this_app_will_soon_be_a_self_sustaining_garden');
    const infoLabel = supporter ? trans('profile.right_now_you_support')
      : trans('profile.as_you_can_see_all_of_are_right_now_co_creating');

    return (
      <LinearGradient style={{ flex: 1 }} colors={Gradients.white}>
        <ScrollView ref={(ref) => { this.scrollView = ref; }} showsVerticalScrollIndicator={false}>
          <Header
            showTitle={!supporter}
            showAvatar={supporter}
            headingLabel={headingLabel}
            infoLabel={infoLabel}
            user={data.profile}
          />
          <View style={styles.linkContent}>
            <TouchableOpacity onPress={() => this.openLink(trans('feed.trello_url'))}>
              <AppText
                size={26}
                fontVariation="semibold"
                color={Colors.text.blue}
              >
                {trans('profile.go_to_trello')}
              </AppText>
            </TouchableOpacity>
            <View style={styles.miniDivider} />
            <TouchableOpacity onPress={() => this.openLink(trans('feed.github_url'))}>
              <AppText
                fontVariation="semibold"
                size={26}
                color={Colors.text.blue}
                style={{ marginBottom: 48 }}
              >
                {trans('profile.go_to_github')}
              </AppText>
            </TouchableOpacity>
            <Title size={23} color={Colors.text.gray} style={{ lineHeight: 36 }}>
              {trans('profile.we_are_currently_also_building')}
            </Title>
          </View>
          {/* {!supporter &&
            <View>
              <Package
                noBackgroud
                elevation={0}
                durationLabel={trans('profile.support_six_month')}
                monthlyAmount={9}
                planId={1}
                supportSubscribe={this.onSupportSubscribe}
                info={trans('profile.auto_renewed_every_six_month', { krona: 54 })}
              />
              <Package
                elevation={20}
                durationLabel={trans('profile.support_one_month')}
                monthlyAmount={29}
                planId={2}
                supportSubscribe={this.onSupportSubscribe}
                info={trans('profile.auto_renewed_every_six_month', { krona: 29 })}
              />
              <HelpMore
                supportSubscribe={this.onSupportSubscribe}
              />
              <HowItWorks />
            </View>
          }
          <Costs supporter={supporter} showCostTitle={!supporter} /> */}
          <ProfileAction
            onPress={() => this.openLink(trans('feed.github_url'))}
            title={trans('profile.we_are_open_source')}
            label={trans('profile.help_make_the_app_better')}
            icon={GithubIcon}
          />
          <ProfileAction
            onPress={() => this.openLink('https://www.transifex.com/skjutsgruppen/the-ridesharing-movement-skjutsgruppen-app/')}
            title={trans('profile.translate')}
            label={trans('profile.help_translate')}
          />
          {/* <ProfileAction
            title={trans('profile.open_api')}
            label={trans('profile.build_get_statistics_and_more')}
            icon={OpenAPIIcon}
          />
          <ProfileAction label={trans('profile.about_the_movement')} />
          <ProfileAction label={trans('profile.international_ridesharingday')} /> */}
          <ProfileAction
            label={trans('profile.your_profile')}
            onPress={() => this.redirect('Profile')}
          />
          {/* {supporter &&
            <ProfileAction
              label={trans('profile.your_support_of_the_garden')}
              onPress={() => this.redirect('YourSupport')}
            />
          } */}
          <ProfileAction onPress={() => this.redirect('Settings')} label={trans('profile.settings')} />
          <ProfileAction
            onPress={() => this.openLink('https://web.skjutsgruppen.nu/participant-agreement')}
            label={trans('profile.participant_agreement')}
          />
          <ProfileAction
            onPress={() => this.openLink('https://web.skjutsgruppen.nu/privacy-policy')}
            label={trans('profile.privacy_policy')}
          />
          <TouchableOpacity onPress={this.logout} style={styles.logout}>
            <AppText
              color={Colors.text.blue}
            >{trans('profile.log_out')}</AppText>
          </TouchableOpacity>
        </ScrollView>
        <ConfirmModal
          loading={subscribing}
          message={alertMessage}
          visible={showConfirmModal}
          onRequestClose={() => this.setState({ showConfirmModal: false })}
          confirmLabel={trans('global.ok')}
          onConfirm={() => this.setState({ showConfirmModal: false })}
          onDeny={() => this.setState({ showConfirmModal: false })}
          cancelable={false}
        />
      </LinearGradient>
    );
  }
}

const mapDispatchToProps = dispatch => ({
  logout: () => AuthService.logout()
    .then(() => dispatch(AuthAction.logout()))
    .catch(error => console.warn(error)),
});

Garden.propTypes = {
  data: PropTypes.shape({
    profile: PropTypes.shape(),
  }).isRequired,
  logout: PropTypes.func.isRequired,
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    goBack: PropTypes.func,
  }).isRequired,
  removeAppToken: PropTypes.func.isRequired,
  support: PropTypes.func.isRequired,
  generateClientToken: PropTypes.string,
  subscribeToUpdatedProfile: PropTypes.func.isRequired,
};

Garden.defaultProps = {
  generateClientToken: null,
};

export default compose(
  withGenerateClientToken,
  withRemoveAppToken,
  withSupport,
  withAccount,
  connect(null, mapDispatchToProps),
)(Garden);
